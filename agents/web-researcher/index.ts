import { defineAgent, useTool } from '@openos/sdk'

const searchTool = useTool({
  name: 'web_search',
  description: 'Search the web and return top results (DuckDuckGo instant answer + related topics).',
  parameters: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  async execute({ query }) {
    const q = encodeURIComponent(String(query))
    const url = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      return { error: `Search failed: ${res.status}`, results: [] }
    }
    const data = (await res.json()) as {
      AbstractText?: string
      AbstractURL?: string
      Heading?: string
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string } | { Topics?: unknown[] }>
    }
    const results: Array<{ title: string; url: string; snippet: string }> = []
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading ?? 'Instant answer',
        url: data.AbstractURL,
        snippet: data.AbstractText,
      })
    }
    const topics = data.RelatedTopics ?? []
    for (const t of topics) {
      if (t && typeof t === 'object' && 'Text' in t && 'FirstURL' in t) {
        const text = (t as { Text?: string }).Text ?? ''
        const firstUrl = (t as { FirstURL?: string }).FirstURL ?? ''
        if (text || firstUrl) {
          results.push({
            title: text.slice(0, 80),
            url: firstUrl,
            snippet: text,
          })
        }
      }
      if (results.length >= 8) break
    }
    return results
  },
})

const fetchTool = useTool({
  name: 'fetch_page',
  description: 'Fetch a URL and return plain text (best-effort HTML stripping).',
  parameters: {
    type: 'object',
    properties: { url: { type: 'string' } },
    required: ['url'],
  },
  async execute({ url }) {
    const u = String(url)
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      return { error: 'Only http(s) URLs are allowed' }
    }
    const res = await fetch(u, {
      headers: { 'User-Agent': 'OpenOS-web-researcher/0.1' },
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50_000)
    return { url: u, text }
  },
})

const modelName =
  process.env.OPENOS_ANTHROPIC_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022'

export default defineAgent({
  id: 'web-researcher',
  name: 'Web Researcher',
  description: 'Researches topics by searching and reading web pages. Returns structured summaries.',
  model: { provider: 'anthropic', model: modelName },
  tools: [searchTool, fetchTool],
  maxTurns: 10,
  systemPrompt: `You are a precise research agent. For any topic:
1. Search for recent, authoritative sources
2. Fetch and read the most relevant pages when URLs are available
3. Synthesize findings into a structured report
Always cite your sources. Prefer primary sources over aggregators.`,
})
