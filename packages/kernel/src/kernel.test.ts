import { describe, expect, it, vi } from 'vitest'
import type { AgentDefinition } from '@open-os/types'
import { Kernel } from './kernel.js'
import { cannedToolCall, createMockLLMAdapter } from './test-utils/mock-adapter.js'

describe('Kernel', () => {
  it('runs task and emits lifecycle events', async () => {
    const mock = createMockLLMAdapter({
      responses: [{ content: 'final answer' }],
    })
    const kernel = new Kernel({ maxConcurrentTasks: 2 }, { getAdapter: () => mock })
    const events: string[] = []
    kernel.on('kernel', (ev: { type: string }) => {
      events.push(ev.type)
    })

    const agent: AgentDefinition = {
      id: 'a1',
      name: 'A',
      description: 'test',
      model: { provider: 'openai', model: 'gpt-test' },
    }
    kernel.register(agent)
    const result = await kernel.run('a1', 'hello')
    expect(result.status).toBe('success')
    expect(result.output).toBe('final answer')
    expect(events).toContain('task:queued')
    expect(events).toContain('task:started')
    expect(events).toContain('task:completed')
  })

  it('executes tool loop then finishes', async () => {
    const mock = createMockLLMAdapter({
      responses: [
        cannedToolCall('echo', { text: 'hi' }, 'thinking'),
        { content: 'done' },
      ],
    })
    const kernel = new Kernel({}, { getAdapter: () => mock })
    kernel.registerTool({
      name: 'echo',
      description: 'echo',
      parameters: { type: 'object' },
      async execute(params) {
        return (params as { text: string }).text
      },
    })
    kernel.register({
      id: 't',
      name: 'T',
      description: 't',
      model: { provider: 'openai', model: 'gpt-test' },
    })
    const toolSpy = vi.fn()
    kernel.on('tool:called', toolSpy)
    const result = await kernel.run('t', 'x')
    expect(result.status).toBe('success')
    expect(toolSpy).toHaveBeenCalled()
  })
})
