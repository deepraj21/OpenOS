import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, LLMAdapter, LLMResponse, ParsedToolCall } from './types.js'

function toAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = []
  for (const m of messages) {
    if (m.role === 'system') continue
    if (m.role === 'user') {
      out.push({ role: 'user', content: m.content })
    } else if (m.role === 'assistant') {
      if (m.toolCalls?.length) {
        const blocks: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = []
        if (m.content) {
          blocks.push({ type: 'text', text: m.content })
        }
        for (let i = 0; i < m.toolCalls.length; i++) {
          const tc = m.toolCalls[i]!
          blocks.push({
            type: 'tool_use',
            id: tc.id ?? `toolu_${i}`,
            name: tc.name,
            input: tc.params ?? {},
          })
        }
        out.push({ role: 'assistant', content: blocks })
      } else {
        out.push({ role: 'assistant', content: m.content })
      }
    } else if (m.role === 'tool') {
      out.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: m.toolCallId ?? 'tool',
            content: m.content,
          },
        ],
      })
    }
  }
  return out
}

function extractSystem(messages: ChatMessage[]): string | undefined {
  const sys = messages.filter((x) => x.role === 'system')
  return sys.map((x) => x.content).join('\n\n') || undefined
}

export function createAnthropicAdapter(): LLMAdapter {
  return {
    async complete(messages, config): Promise<LLMResponse> {
      const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('Anthropic adapter: missing apiKey or ANTHROPIC_API_KEY')
      }
      const client = new Anthropic({ apiKey, baseURL: config.baseURL })
      const system = extractSystem(messages)
      const toolDefs = (config as { _openosTools?: { name: string; description: string; parameters: Record<string, unknown> }[] })
        ._openosTools

      const tools: Anthropic.Tool[] | undefined = toolDefs?.length
        ? toolDefs.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters as Anthropic.Tool['input_schema'],
          }))
        : undefined

      const response = await client.messages.create({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        temperature: config.temperature,
        system: system ?? '',
        messages: toAnthropicMessages(messages),
        tools,
      })

      const toolCalls: ParsedToolCall[] = []
      let text = ''
      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            params: (block.input ?? {}) as Record<string, unknown>,
          })
        }
      }

      return {
        content: text,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        tokensUsed:
          (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      }
    },
  }
}
