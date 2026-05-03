import type { ModelConfig } from '@openos/types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  /** When replaying an assistant turn that invoked tools (OpenAI / Anthropic). */
  toolCalls?: ParsedToolCall[]
  toolCallId?: string
  name?: string
}

export interface ParsedToolCall {
  id?: string
  name: string
  params: Record<string, unknown>
}

export interface LLMResponse {
  content: string
  toolCalls?: ParsedToolCall[]
  tokensUsed?: number
}

export interface LLMAdapter {
  complete(messages: ChatMessage[], config: ModelConfig): Promise<LLMResponse>
}

export type ProviderKey = ModelConfig['provider']
