import { describe, expect, it, vi } from 'vitest'
import type { AgentContext, ToolDefinition } from '@openos/types'
import { ToolRegistry } from './tool-registry.js'

function ctx(): AgentContext {
  return {
    agentId: 'agent',
    sessionId: 'sess',
    memory: {
      async get() {
        return undefined
      },
      async set() {},
      async delete() {},
      async list() {
        return []
      },
      async clear() {},
    },
    tools: new Map(),
    emit: vi.fn(),
    log: vi.fn(),
  }
}

describe('ToolRegistry', () => {
  it('registers and executes', async () => {
    const r = new ToolRegistry()
    const tool: ToolDefinition = {
      name: 'add',
      description: 'add',
      parameters: { type: 'object' },
      async execute(params) {
        return (params as { a: number }).a + (params as { b: number }).b
      },
    }
    r.register(tool)
    const { result, toolCall } = await r.execute('add', { a: 2, b: 3 }, ctx())
    expect(result).toBe(5)
    expect(toolCall.tool).toBe('add')
    expect(toolCall.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('captures errors without throwing', async () => {
    const r = new ToolRegistry()
    r.register({
      name: 'boom',
      description: 'x',
      parameters: {},
      async execute() {
        throw new Error('nope')
      },
    })
    const { result, toolCall } = await r.execute('boom', {}, ctx())
    expect(toolCall.tool).toBe('boom')
    expect(result).toEqual({ error: 'nope' })
  })
})
