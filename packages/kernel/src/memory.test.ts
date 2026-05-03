import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryStore, EphemeralMemoryStore } from './memory.js'

describe('EphemeralMemoryStore', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('get/set/delete', async () => {
    const m = new EphemeralMemoryStore()
    await m.set('k', { a: 1 })
    expect(await m.get('k')).toEqual({ a: 1 })
    await m.delete('k')
    expect(await m.get('k')).toBeUndefined()
    m.dispose()
  })

  it('expires keys by ttl', async () => {
    vi.useFakeTimers()
    const m = new EphemeralMemoryStore()
    await m.set('k', 1, 1000)
    vi.advanceTimersByTime(31_000)
    await Promise.resolve()
    expect(await m.get('k')).toBeUndefined()
    m.dispose()
  })

  it('list respects prefix', async () => {
    const m = new EphemeralMemoryStore()
    await m.set('a:1', 1)
    await m.set('a:2', 2)
    await m.set('b:1', 3)
    const keys = await m.list('a:')
    expect(keys.sort()).toEqual(['a:1', 'a:2'])
    m.dispose()
  })
})

describe('createMemoryStore', () => {
  it('shared reuses per session', async () => {
    const cache = new Map()
    const s1 = createMemoryStore({ type: 'shared' }, { sessionId: 's1', sessionStores: cache })
    const s2 = createMemoryStore({ type: 'shared' }, { sessionId: 's1', sessionStores: cache })
    await s1.set('x', 42)
    expect(await s2.get('x')).toBe(42)
  })
})
