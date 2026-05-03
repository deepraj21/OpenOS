import type { MemoryStore } from '@openos/types'

/**
 * @description Typed memory helper scoped to a namespace prefix.
 * @param namespace — Key prefix for all operations.
 * @param store — Underlying memory store from the kernel context.
 * @returns Namespaced get/set/delete/list helpers.
 * @example
 * ```ts
 * const mem = useMemory('notes', context.memory)
 * await mem.set('a', { text: 'hello' })
 * ```
 */
export function useMemory(namespace: string, store: MemoryStore) {
  const prefix = namespace.endsWith(':') ? namespace : `${namespace}:`

  return {
    async get<T>(key: string): Promise<T | null> {
      const v = await store.get(prefix + key)
      return (v as T) ?? null
    },

    async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
      await store.set(prefix + key, value, ttlMs)
    },

    async delete(key: string): Promise<void> {
      await store.delete(prefix + key)
    },

    async list(): Promise<string[]> {
      const keys = await store.list(prefix)
      return keys.map((k) => (k.startsWith(prefix) ? k.slice(prefix.length) : k))
    },
  }
}
