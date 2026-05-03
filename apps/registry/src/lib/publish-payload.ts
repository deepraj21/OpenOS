/**
 * @description JSON body for `POST /api/agents` (publish).
 */
export interface PublishPayload {
  /** Semantic version for this artifact */
  version: string
  /** Installable TypeScript module source (e.g. default export defineAgent) */
  code: string
  /** Serializable subset of AgentDefinition (no tool execute fns) */
  manifest: PublishManifest
  /** Optional release notes */
  changelog?: string
  /** Optional human author string */
  author?: string
}

export interface PublishManifest {
  id: string
  name: string
  description: string
  model?: Record<string, unknown>
  systemPrompt?: string
  maxTurns?: number
  timeout?: number
  tags?: string[]
  tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>
  memory?: Record<string, unknown>
}

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * @description Parses and validates publish JSON; throws `Error` with message for 400 responses.
 * @param body Parsed JSON body from the request.
 * @returns Normalized publish payload.
 */
export function parsePublishBody(body: unknown): PublishPayload {
  if (!isPlainObject(body)) {
    throw new Error('Body must be a JSON object')
  }
  const version = body.version
  const code = body.code
  const manifest = body.manifest
  if (typeof version !== 'string' || !SEMVER.test(version.trim())) {
    throw new Error('Invalid or missing semver `version`')
  }
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('`code` must be a non-empty string')
  }
  if (!isPlainObject(manifest)) {
    throw new Error('`manifest` must be an object')
  }
  const id = manifest.id
  const name = manifest.name
  const description = manifest.description
  if (typeof id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    throw new Error('`manifest.id` must be kebab-case (e.g. web-researcher)')
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('`manifest.name` is required')
  }
  if (typeof description !== 'string') {
    throw new Error('`manifest.description` must be a string')
  }
  const changelog = body.changelog
  const author = body.author
  if (changelog !== undefined && typeof changelog !== 'string') {
    throw new Error('`changelog` must be a string when provided')
  }
  if (author !== undefined && typeof author !== 'string') {
    throw new Error('`author` must be a string when provided')
  }
  return {
    version: version.trim(),
    code,
    manifest: manifest as unknown as PublishManifest,
    changelog: typeof changelog === 'string' ? changelog : undefined,
    author: typeof author === 'string' ? author : undefined,
  }
}
