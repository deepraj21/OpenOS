import { readFile } from 'node:fs/promises'
import type { AgentDefinition } from '@open-os/types'

/**
 * @description Builds a JSON-serializable manifest from a loaded agent (no executable tool bodies).
 * @param agent Agent definition loaded from disk.
 * @returns Plain object suitable for registry `manifest` field.
 */
export function manifestForPublish(agent: AgentDefinition): Record<string, unknown> {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    ...(agent.model !== undefined ? { model: agent.model as unknown as Record<string, unknown> } : {}),
    ...(agent.systemPrompt !== undefined ? { systemPrompt: agent.systemPrompt } : {}),
    ...(agent.maxTurns !== undefined ? { maxTurns: agent.maxTurns } : {}),
    ...(agent.timeout !== undefined ? { timeout: agent.timeout } : {}),
    ...(agent.tags !== undefined ? { tags: agent.tags } : {}),
    ...(agent.memory !== undefined ? { memory: agent.memory as unknown as Record<string, unknown> } : {}),
    ...(agent.tools !== undefined
      ? {
          tools: agent.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        }
      : {}),
  }
}

/**
 * @description Reads UTF-8 source for publish payload `code`.
 * @param absPath Absolute path to the agent module.
 * @returns File contents.
 */
export async function readAgentSource(absPath: string): Promise<string> {
  return readFile(absPath, 'utf8')
}

export interface InstallRef {
  slug: string
  version?: string
}

/**
 * @description Parses `slug` or `slug@version` from CLI install argument.
 * @param spec User argument (e.g. `web-researcher@1.0.0`).
 * @returns Slug and optional semver.
 */
export function parseInstallRef(spec: string): InstallRef {
  const s = spec.trim()
  const at = s.lastIndexOf('@')
  if (at <= 0 || at === s.length - 1) {
    return { slug: s.replace(/^@+/, '') }
  }
  const slug = s.slice(0, at).replace(/^@+/, '')
  const version = s.slice(at + 1).trim()
  return { slug, version: version || undefined }
}

/**
 * @description Resolves registry base URL (no trailing slash).
 */
export function registryBaseUrl(): string {
  const u = (process.env.OPENOS_REGISTRY_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
  return u
}

/**
 * @description Authorization header value when `OPENOS_REGISTRY_TOKEN` is set.
 */
export function registryAuthHeaders(): HeadersInit {
  const token = process.env.OPENOS_REGISTRY_TOKEN?.trim()
  if (!token) {
    return {}
  }
  return { Authorization: `Bearer ${token}` }
}
