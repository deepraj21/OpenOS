import { type AgentCard, fetchAgentCard, resolveJsonRpcUrl } from './agent-card.js'
import { a2aJsonRpcCall } from './json-rpc.js'

export interface A2aDelegateOptions {
  /** Full URL to Agent Card JSON (or pass `card` + `rpcUrl`) */
  cardUrl?: string
  /** Pre-fetched Agent Card */
  card?: AgentCard
  /** Override JSON-RPC endpoint when it cannot be inferred from the card */
  rpcUrl?: string
  /** User text to send as a single text part */
  input: string
  /** Merged into `fetch` for card + RPC calls (e.g. Authorization) */
  fetchInit?: RequestInit
}

/**
 * @description Sends a minimal `SendMessage` JSON-RPC request and returns the raw `result` object.
 * @param options Card discovery and user input.
 * @returns Parsed JSON-RPC result (binding-specific shape).
 * @example
 * ```typescript
 * const result = await a2aDelegateRun({
 *   cardUrl: 'https://example.com/.well-known/agent-card.json',
 *   rpcUrl: 'https://example.com/rpc',
 *   input: 'Summarize A2A for me.',
 * })
 * ```
 */
export async function a2aDelegateRun(options: A2aDelegateOptions): Promise<unknown> {
  const card =
    options.card ??
    (options.cardUrl !== undefined ? await fetchAgentCard(options.cardUrl, options.fetchInit) : undefined)
  if (!card) {
    throw new Error('Provide `card` or `cardUrl`')
  }
  const base = options.rpcUrl ?? resolveJsonRpcUrl(card)
  if (!base) {
    throw new Error('Could not resolve JSON-RPC URL; pass `rpcUrl` explicitly')
  }
  const params = {
    message: {
      role: 'user',
      parts: [{ kind: 'text', text: options.input }],
    },
  }
  return a2aJsonRpcCall(base, 'SendMessage', params, options.fetchInit)
}
