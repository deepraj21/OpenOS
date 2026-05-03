import { describe, expect, it } from 'vitest'
import type { AgentDefinition } from '@openos/types'
import { manifestForPublish, parseInstallRef } from './registry.js'

describe('parseInstallRef', () => {
  it('parses slug only', () => {
    expect(parseInstallRef('web-researcher')).toEqual({ slug: 'web-researcher' })
  })

  it('parses slug@version', () => {
    expect(parseInstallRef('web-researcher@2.1.0')).toEqual({
      slug: 'web-researcher',
      version: '2.1.0',
    })
  })
})

describe('manifestForPublish', () => {
  it('strips execute from tools', () => {
    const agent: AgentDefinition = {
      id: 'x',
      name: 'X',
      description: 'D',
      tools: [
        {
          name: 't',
          description: 'td',
          parameters: { type: 'object', properties: {} },
          execute: async () => ({}),
        },
      ],
    }
    const m = manifestForPublish(agent) as { tools: Array<{ name: string }> }
    expect(m.tools).toHaveLength(1)
    expect(m.tools[0].name).toBe('t')
    expect('execute' in m.tools[0]).toBe(false)
  })
})
