import { afterEach, describe, expect, it } from 'vitest'
import { isAuthorizedToPublish } from './registry-auth.js'

describe('isAuthorizedToPublish', () => {
  const prev = process.env.OPENOS_REGISTRY_API_KEYS

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.OPENOS_REGISTRY_API_KEYS
    } else {
      process.env.OPENOS_REGISTRY_API_KEYS = prev
    }
  })

  it('allows when no API keys configured', () => {
    delete process.env.OPENOS_REGISTRY_API_KEYS
    const ok = isAuthorizedToPublish(new Request('http://x', { headers: {} }))
    expect(ok).toBe(true)
  })

  it('rejects missing bearer when keys set', () => {
    process.env.OPENOS_REGISTRY_API_KEYS = 'secret-one,secret-two'
    const ok = isAuthorizedToPublish(new Request('http://x', { headers: {} }))
    expect(ok).toBe(false)
  })

  it('accepts matching bearer token', () => {
    process.env.OPENOS_REGISTRY_API_KEYS = 'alpha,beta'
    const ok = isAuthorizedToPublish(
      new Request('http://x', { headers: { Authorization: 'Bearer beta' } }),
    )
    expect(ok).toBe(true)
  })

  it('rejects wrong token', () => {
    process.env.OPENOS_REGISTRY_API_KEYS = 'alpha'
    const ok = isAuthorizedToPublish(
      new Request('http://x', { headers: { Authorization: 'Bearer wrong' } }),
    )
    expect(ok).toBe(false)
  })
})
