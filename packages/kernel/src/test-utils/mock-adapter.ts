import type { ModelConfig } from '@open-os/types'
import type { ChatMessage, LLMAdapter, LLMResponse, ParsedToolCall } from '../adapters/types.js'

export interface MockAdapterScript {
  responses: LLMResponse[]
}

/**
 * @description Deterministic LLM adapter for tests (never calls the network).
 */
export function createMockLLMAdapter(script: MockAdapterScript): LLMAdapter {
  let i = 0
  return {
    async complete(_messages: ChatMessage[], _config: ModelConfig): Promise<LLMResponse> {
      const r = script.responses[i] ?? { content: '' }
      i++
      return r
    },
  }
}

export function cannedToolCall(
  name: string,
  params: Record<string, unknown>,
  content = '',
): LLMResponse {
  const toolCalls: ParsedToolCall[] = [{ name, params }]
  return { content, toolCalls }
}
