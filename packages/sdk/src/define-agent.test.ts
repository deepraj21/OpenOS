import { describe, expect, it } from 'vitest'
import { defineAgent } from './define-agent.js'

describe('defineAgent', () => {
  it('returns agent with defaults', () => {
    const a = defineAgent({
      id: 'x',
      name: 'X',
      description: 'D',
    })
    expect(a.id).toBe('x')
    expect(a.maxTurns).toBe(25)
  })

  it('throws on missing id', () => {
    expect(() =>
      defineAgent({ id: '', name: 'n', description: 'd' }),
    ).toThrow(/id/)
  })
})
