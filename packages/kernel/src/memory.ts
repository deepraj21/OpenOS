import type { MemoryConfig, MemoryStore } from '@openos/types'

interface Entry {
  value: unknown
  expiresAt?: number
}

export class EphemeralMemoryStore implements MemoryStore {
  private readonly map = new Map<string, Entry>()
  private evictionTimer: ReturnType<typeof setInterval> | undefined
  private readonly maxItems?: number

  constructor(options?: { maxItems?: number }) {
    this.maxItems = options?.maxItems
    this.evictionTimer = setInterval(() => {
      this.evictExpired()
    }, 30_000)
    this.evictionTimer.unref?.()
  }

  dispose(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer)
      this.evictionTimer = undefined
    }
  }

  private evictExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.map) {
      if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
        this.map.delete(key)
      }
    }
  }

  async get(key: string): Promise<unknown> {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.map.delete(key)
      return undefined
    }
    return entry.value
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    if (this.maxItems !== undefined && this.map.size >= this.maxItems && !this.map.has(key)) {
      const first = this.map.keys().next().value as string | undefined
      if (first !== undefined) this.map.delete(first)
    }
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : undefined
    this.map.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key)
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = [...this.map.keys()]
    if (!prefix) return keys.sort()
    return keys.filter((k) => k.startsWith(prefix)).sort()
  }

  async clear(): Promise<void> {
    this.map.clear()
  }
}

/** Shared in-process store for a session (factory-managed singleton per session id). */
export class SharedMemoryStore extends EphemeralMemoryStore {}

export interface CreateMemoryStoreOptions {
  sessionId?: string
  /** Kernel-owned map for `shared` memory type. */
  sessionStores?: Map<string, MemoryStore>
}

/**
 * @description Creates a MemoryStore from MemoryConfig.
 * @param config — Memory configuration from the agent.
 * @param options — Session id and optional shared store cache.
 * @returns MemoryStore implementation.
 */
export function createMemoryStore(
  config: MemoryConfig,
  options?: CreateMemoryStoreOptions,
): MemoryStore {
  const maxItems = config.maxItems
  if (config.type === 'shared') {
    const sid = options?.sessionId ?? '_default'
    const cache = options?.sessionStores
    if (!cache) {
      return new SharedMemoryStore({ maxItems })
    }
    let existing = cache.get(sid)
    if (!existing) {
      existing = new SharedMemoryStore({ maxItems })
      cache.set(sid, existing)
    }
    return existing
  }
  if (config.type === 'persistent') {
    return new EphemeralMemoryStore({
      maxItems,
    })
  }
  return new EphemeralMemoryStore({ maxItems })
}
