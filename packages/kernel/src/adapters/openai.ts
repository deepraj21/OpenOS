import OpenAI from 'openai'
import type { ChatMessage, LLMAdapter, LLMResponse, ParsedToolCall } from './types.js'

function toOpenAIMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.ChatCompletionMessageParam[] = []
  for (const m of messages) {
    if (m.role === 'system') {
      out.push({ role: 'system', content: m.content })
    } else if (m.role === 'user') {
      out.push({ role: 'user', content: m.content })
    } else if (m.role === 'assistant') {
      if (m.toolCalls?.length) {
        out.push({
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc, i) => ({
            id: tc.id ?? `call_${i}`,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.params ?? {}) },
          })),
        })
      } else {
        out.push({ role: 'assistant', content: m.content })
      }
    } else if (m.role === 'tool') {
      out.push({
        role: 'tool',
        tool_call_id: m.toolCallId ?? 'tool',
        content: m.content,
      })
    }
  }
  return out
}

function toolsFromDefinitions(
  tools: { name: string; description: string; parameters: Record<string, unknown> }[],
): OpenAI.Chat.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown> as OpenAI.FunctionParameters,
    },
  }))
}

export function createOpenAIAdapter(): LLMAdapter {
  return {
    async complete(messages, config): Promise<LLMResponse> {
      const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenAI adapter: missing apiKey or OPENAI_API_KEY')
      }
      const client = new OpenAI({
        apiKey,
        baseURL: config.baseURL,
      })
      const toolDefs = (config as { _openosTools?: { name: string; description: string; parameters: Record<string, unknown> }[] })
        ._openosTools
      const tools = toolDefs?.length ? toolsFromDefinitions(toolDefs) : undefined

      const completion = await client.chat.completions.create({
        model: config.model,
        messages: toOpenAIMessages(messages),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        tools,
        tool_choice: tools ? 'auto' : undefined,
      })

      const choice = completion.choices[0]
      const msg = choice?.message
      const toolCalls: ParsedToolCall[] = []
      if (msg?.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          if (tc.type !== 'function') continue
          let params: Record<string, unknown> = {}
          try {
            params = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>
          } catch {
            params = {}
          }
          toolCalls.push({ id: tc.id, name: tc.function.name, params })
        }
      }

      return {
        content: msg?.content ?? '',
        toolCalls: toolCalls.length ? toolCalls : undefined,
        tokensUsed: completion.usage?.total_tokens,
      }
    },
  }
}
