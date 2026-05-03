/**
 * @description Parsed Agent Card document (subset; A2A allows extensions).
 * @see https://github.com/a2aproject/A2A
 */
export type AgentCard = Record<string, unknown>

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * @description Fetches an Agent Card JSON document from a URL (full card URL or `.well-known` URL).
 * @param cardUrl HTTPS URL to the Agent Card JSON.
 * @param init Optional `fetch` init (auth headers, etc.).
 * @returns Parsed JSON object.
 */
export async function fetchAgentCard(cardUrl: string, init?: RequestInit): Promise<AgentCard> {
  const res = await fetch(cardUrl, {
    ...init,
    headers: {
      Accept: 'application/json, application/a2a+json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Agent card HTTP ${res.status}`)
  }
  const data: unknown = await res.json()
  if (!isRecord(data)) {
    throw new Error('Agent card must be a JSON object')
  }
  return data
}

/**
 * @description Best-effort resolution of JSON-RPC base URL from an Agent Card (implementations vary).
 * @param card Agent Card object.
 * @returns Absolute URL to POST JSON-RPC requests, or `undefined` if unknown.
 */
export function resolveJsonRpcUrl(card: AgentCard): string | undefined {
  const direct = card.url
  if (typeof direct === 'string' && direct.startsWith('http')) {
    return direct.replace(/\/+$/, '')
  }
  const transports = card.transports
  if (Array.isArray(transports)) {
    for (const t of transports) {
      if (!isRecord(t)) continue
      if (String(t.type ?? '').toUpperCase().includes('JSON')) {
        const u = t.url
        if (typeof u === 'string' && u.startsWith('http')) {
          return u.replace(/\/+$/, '')
        }
      }
    }
  }
  const caps = card.capabilities
  if (isRecord(caps)) {
    const u = caps.jsonRpcUrl ?? caps.rpcUrl
    if (typeof u === 'string' && u.startsWith('http')) {
      return u.replace(/\/+$/, '')
    }
  }
  return undefined
}
