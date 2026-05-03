export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: unknown
}

export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: '2.0'
  id: string | number | null
  result: T
}

export interface JsonRpcError {
  jsonrpc: '2.0'
  id: string | number | null
  error: { code: number; message: string; data?: unknown }
}

/**
 * @description POSTs a JSON-RPC 2.0 call to an A2A HTTP endpoint.
 * @param rpcBase Base URL (e.g. `https://agent.example.com/rpc`).
 * @param method PascalCase method name per A2A JSON-RPC binding (e.g. `SendMessage`).
 * @param params Method params object.
 * @param init Optional fetch init merged into headers.
 */
export async function a2aJsonRpcCall<T = unknown>(
  rpcBase: string,
  method: string,
  params: unknown,
  init?: RequestInit,
): Promise<T> {
  const url = rpcBase.startsWith('http') ? rpcBase : `https://${rpcBase}`
  const body: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  }
  const res = await fetch(url, {
    method: 'POST',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let parsed: JsonRpcSuccess<T> | JsonRpcError | Record<string, unknown> = {}
  try {
    parsed = JSON.parse(text) as JsonRpcSuccess<T> | JsonRpcError
  } catch {
    throw new Error(`Invalid JSON-RPC response (${res.status}): ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    throw new Error(`JSON-RPC HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  if ('error' in parsed && parsed.error) {
    const e = parsed.error
    throw new Error(`JSON-RPC error ${e.code}: ${e.message}`)
  }
  if ('result' in parsed) {
    return parsed.result as T
  }
  throw new Error('JSON-RPC response missing result')
}
