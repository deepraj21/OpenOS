import { describe, expect, it } from 'vitest'
import { cannedToolCall, createMockLLMAdapter } from '@openos/kernel'
import { createOS } from './create-os.js'
import { defineAgent } from './define-agent.js'

describe('createOS', () => {
  it('define → use → run returns TaskResult', async () => {
    const mock = createMockLLMAdapter({ responses: [{ content: 'ok' }] })
    const os = createOS({}, { getAdapter: () => mock })
    os.use(
      defineAgent({
        id: 'a',
        name: 'A',
        description: 'd',
        model: { provider: 'openai', model: 'gpt-test' },
      }),
    )
    const result = await os.run('a', 'hi')
    expect(result.status).toBe('success')
    expect(result.output).toBe('ok')
  })

  it('runs tool loop via kernel', async () => {
    const mock = createMockLLMAdapter({
      responses: [cannedToolCall('noop', {}, ''), { content: 'final' }],
    })
    const os = createOS({}, { getAdapter: () => mock })
    os.kernel.registerTool({
      name: 'noop',
      description: 'noop',
      parameters: { type: 'object' },
      async execute() {
        return null
      },
    })
    os.use(
      defineAgent({
        id: 'agent',
        name: 'Agent',
        description: 'd',
        model: { provider: 'openai', model: 'gpt-test' },
      }),
    )
    const result = await os.run('agent', 'x')
    expect(result.status).toBe('success')
    expect(result.output).toBe('final')
  })
})
