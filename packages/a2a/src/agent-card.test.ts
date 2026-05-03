import { describe, expect, it } from 'vitest'
import { resolveJsonRpcUrl } from './agent-card.js'

describe('resolveJsonRpcUrl', () => {
  it('reads top-level url', () => {
    expect(resolveJsonRpcUrl({ url: 'https://x.example/rpc/' })).toBe('https://x.example/rpc')
  })

  it('reads transports', () => {
    const card = {
      transports: [{ type: 'JSONRPC', url: 'https://agent/rpc' }],
    }
    expect(resolveJsonRpcUrl(card)).toBe('https://agent/rpc')
  })
})
