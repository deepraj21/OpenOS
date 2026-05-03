/**
 * @description Validates `Authorization: Bearer <token>` when `OPENOS_REGISTRY_API_KEYS` is set (comma-separated).
 * @param request Incoming HTTP request.
 * @returns `true` if the caller is authorized to publish.
 */
export function isAuthorizedToPublish(request: Request): boolean {
  const keysEnv = process.env.OPENOS_REGISTRY_API_KEYS?.trim()
  if (!keysEnv) {
    return true
  }
  const allowed = keysEnv.split(',').map((k) => k.trim()).filter(Boolean)
  const auth = request.headers.get('authorization') ?? ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  const token = m?.[1]?.trim()
  if (!token) {
    return false
  }
  return allowed.includes(token)
}

/**
 * @description HTTP 401 body helper when publish is denied.
 */
export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
