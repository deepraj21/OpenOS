import type { LLMAdapter, LLMResponse, ParsedToolCall } from './types.js'

interface OllamaChatRequest {
  model: string
  messages: { role: string; content: string }[]
  stream?: boolean
  options?: { temperature?: number; num_predict?: number }
  tools?: Array<{
    type: 'function'
    function: { name: string; description: string; parameters: Record<string, unknown> }
  }>
}

interface OllamaChatResponse {
  message?: {
    role: string
    content: string
    tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> | string } }>
  }
  eval_count?: number
}

export function createOllamaAdapter(): LLMAdapter {
  return {
    async complete(messages, config): Promise<LLMResponse> {
      const base =
        config.baseURL ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
      const url = `${base.replace(/\/$/, '')}/api/chat`

      const toolDefs = (config as { _openosTools?: { name: string; description: string; parameters: Record<string, unknown> }[] })
        ._openosTools
      const tools = toolDefs?.length
        ? toolDefs.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }))
        : undefined

      const body: OllamaChatRequest = {
        model: config.model,
        messages: messages.map((m) => ({
          role: m.role === 'tool' ? 'user' : m.role,
          content:
            m.role === 'tool'
              ? `Tool result (${m.name ?? m.toolCallId}): ${m.content}`
              : m.content,
        })),
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
        tools,
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Ollama request failed: ${res.status} ${errText}`)
      }
      const data = (await res.json()) as OllamaChatResponse
      const msg = data.message
      const toolCalls: ParsedToolCall[] = []
      if (msg?.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          const raw = tc.function.arguments
          const params =
            typeof raw === 'string'
              ? (JSON.parse(raw || '{}') as Record<string, unknown>)
              : (raw ?? {})
          toolCalls.push({ name: tc.function.name, params })
        }
      }
      return {
        content: msg?.content ?? '',
        toolCalls: toolCalls.length ? toolCalls : undefined,
        tokensUsed: data.eval_count,
      }
    },
  }
}
