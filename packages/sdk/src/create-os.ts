import type { AgentDefinition, KernelConfig, TaskResult } from '@openos/types'
import { getAdapter, Kernel, type KernelStats } from '@openos/kernel'
import { defineAgent } from './define-agent.js'
import { useTool } from './use-tool.js'

export interface CreateOSOptions {
  /** @internal For tests — inject a mock LLM adapter factory. */
  getAdapter?: typeof getAdapter
}

export interface CreateOSResult {
  kernel: Kernel
  defineAgent: typeof defineAgent
  useTool: typeof useTool
  use(agent: AgentDefinition): void
  run(agentId: string, input: string | Record<string, unknown>): Promise<TaskResult>
  on(event: string, handler: (...args: unknown[]) => void): void
  stats(): KernelStats
}

/**
 * @description Boots a kernel and returns the primary OpenOS developer API.
 * @param config — Optional kernel configuration (concurrency, timeouts, log level).
 * @param options — Optional overrides (for example inject `getAdapter` in tests).
 * @returns API surface: kernel, builders, register, run, events, stats.
 * @example
 * ```ts
 * const os = createOS({ maxConcurrentTasks: 5 })
 * const researcher = defineAgent({
 *   id: 'researcher',
 *   name: 'Web Researcher',
 *   description: 'Research agent',
 *   model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
 * })
 * os.use(researcher)
 * await os.run('researcher', 'What is OpenOS?')
 * ```
 */
export function createOS(config?: KernelConfig, options?: CreateOSOptions): CreateOSResult {
  const kernel = new Kernel(config, options?.getAdapter ? { getAdapter: options.getAdapter } : undefined)

  return {
    kernel,
    defineAgent,
    useTool,
    use(agent: AgentDefinition) {
      kernel.register(agent)
    },
    run(agentId: string, input: string | Record<string, unknown>) {
      return kernel.run(agentId, input)
    },
    on(event: string, handler: (...args: unknown[]) => void) {
      kernel.on(event, (...args: unknown[]) => {
        handler(...args)
      })
    },
    stats() {
      return kernel.stats()
    },
  }
}
