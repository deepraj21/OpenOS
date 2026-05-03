import type { ModelConfig } from '@open-os/types'
import { createAnthropicAdapter } from './anthropic.js'
import { createOllamaAdapter } from './ollama.js'
import { createOpenAIAdapter } from './openai.js'
import type { LLMAdapter } from './types.js'

const openai = createOpenAIAdapter()
const anthropic = createAnthropicAdapter()
const ollama = createOllamaAdapter()

/**
 * @description Returns the LLM adapter for the configured provider.
 * @param provider — Model provider key from ModelConfig.
 * @returns LLMAdapter implementation.
 * @example
 * ```ts
 * const adapter = getAdapter('openai')
 * await adapter.complete([{ role: 'user', content: 'hi' }], { provider: 'openai', model: 'gpt-4o-mini' })
 * ```
 */
export function getAdapter(provider: ModelConfig['provider']): LLMAdapter {
  if (provider === 'openai') return openai
  if (provider === 'anthropic') return anthropic
  if (provider === 'ollama') return ollama
  if (provider === 'gemini' || provider === 'custom') {
    throw new Error(`LLM adapter for provider "${provider}" is not implemented yet.`)
  }
  const _exhaustive: never = provider
  return _exhaustive
}

export type { ChatMessage, LLMAdapter, LLMResponse, ParsedToolCall } from './types.js'
