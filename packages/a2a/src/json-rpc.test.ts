import { afterEach, describe, expect, it, vi } from 'vitest'
import { a2aJsonRpcCall } from './json-rpc.js'

describe('a2aJsonRpcCall', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns JSON-RPC result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { task: { id: 't1' } },
          }),
      }),
    )
    const r = await a2aJsonRpcCall('https://example/rpc', 'SendMessage', { x: 1 })
    expect(r).toEqual({ task: { id: 't1' } })
  })

  it('throws on JSON-RPC error object', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -1, message: 'bad' },
          }),
      }),
    )
    await expect(a2aJsonRpcCall('https://example/rpc', 'SendMessage', {})).rejects.toThrow('bad')
  })
})
