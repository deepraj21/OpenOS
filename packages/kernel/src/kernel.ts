import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import type {
  AgentContext,
  AgentDefinition,
  KernelConfig,
  KernelEvent,
  MemoryStore,
  Task,
  TaskResult,
  ToolDefinition,
} from '@open-os/types'
import { getAdapter } from './adapters/index.js'
import { AgentExecutor } from './executor.js'
import { createMemoryStore } from './memory.js'
import { TaskScheduler } from './scheduler.js'
import { ToolRegistry } from './tool-registry.js'

export interface RunOptions {
  sessionId?: string
  priority?: number
  timeout?: number
  metadata?: Record<string, unknown>
}

export interface KernelStats {
  registeredAgents: number
  queuedTasks: number
  runningTasks: number
  completedTasks: number
  failedTasks: number
  uptimeMs: number
}

interface PendingRun {
  task: Task
  resolve: (r: TaskResult) => void
  reject: (e: Error) => void
}

const LOG_ORDER: Record<NonNullable<KernelConfig['logLevel']>, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * @description OpenOS kernel: agents, tools, scheduling, and task execution.
 */
export class Kernel extends EventEmitter {
  private readonly agents = new Map<string, AgentDefinition>()
  private readonly globalTools = new ToolRegistry()
  private readonly scheduler = new TaskScheduler()
  private readonly sessionMemoryStores = new Map<string, MemoryStore>()
  private readonly pending = new Map<string, PendingRun>()
  private readonly executor: AgentExecutor
  private started = false
  private activeTasks = 0
  private pumpScheduled = false
  private readonly startedAt = Date.now()
  private completedTasks = 0
  private failedTasks = 0
  private readonly maxConcurrent: number
  private readonly defaultTimeout: number

  constructor(
    private readonly config: KernelConfig = {},
    deps?: { getAdapter?: typeof getAdapter },
  ) {
    super()
    const get = deps?.getAdapter ?? getAdapter
    this.executor = new AgentExecutor({ getAdapter: get })
    this.maxConcurrent = config.maxConcurrentTasks ?? 10
    this.defaultTimeout = config.defaultTimeout ?? 60_000
  }

  private emitKernelEvent(event: KernelEvent): void {
    this.emit(event.type, event)
    this.emit('kernel', event)
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const min = this.config.logLevel ?? 'info'
    return LOG_ORDER[level] >= LOG_ORDER[min]
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: unknown): void {
    if (!this.shouldLog(level)) return
    this.emit('log', { level, message, meta })
  }

  register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent)
    this.emitKernelEvent({ type: 'agent:registered', agentId: agent.id })
  }

  unregister(id: string): void {
    if (this.agents.delete(id)) {
      this.emitKernelEvent({ type: 'agent:unregistered', agentId: id })
    }
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id)
  }

  listAgents(): AgentDefinition[] {
    return [...this.agents.values()]
  }

  registerTool(tool: ToolDefinition): void {
    this.globalTools.register(tool)
  }

  async start(): Promise<void> {
    if (this.started) return
    this.started = true
    this.schedulePump()
  }

  async stop(): Promise<void> {
    this.started = false
    await this.waitForIdle()
  }

  private async waitForIdle(): Promise<void> {
    const deadline = Date.now() + 120_000
    while ((this.scheduler.size() > 0 || this.activeTasks > 0) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 20))
    }
  }

  async run(
    agentId: string,
    input: string | Record<string, unknown>,
    options?: RunOptions,
  ): Promise<TaskResult> {
    await this.start()

    const task: Task = {
      id: randomUUID(),
      agentId,
      input,
      priority: options?.priority,
      sessionId: options?.sessionId,
      metadata: {
        ...(options?.metadata ?? {}),
        ...(options?.timeout !== undefined ? { openosTimeout: options.timeout } : {}),
      },
      createdAt: new Date(),
    }

    return new Promise<TaskResult>((resolve, reject) => {
      this.pending.set(task.id, { task, resolve, reject })
      this.scheduler.enqueue(task)
      this.emitKernelEvent({ type: 'task:queued', task })
      this.schedulePump()
    })
  }

  private schedulePump(): void {
    if (this.pumpScheduled) return
    this.pumpScheduled = true
    queueMicrotask(() => {
      this.pumpScheduled = false
      void this.pump()
    })
  }

  private async pump(): Promise<void> {
    while (this.started && this.activeTasks < this.maxConcurrent && this.scheduler.size() > 0) {
      const task = this.scheduler.dequeue()
      if (!task) break
      const pending = this.pending.get(task.id)
      if (!pending) continue
      this.activeTasks++
      void this.runTask(task, pending).finally(() => {
        this.activeTasks--
        this.schedulePump()
      })
    }
  }

  private mergeToolRegistry(agent: AgentDefinition): ToolRegistry {
    const merged = new ToolRegistry()
    for (const t of this.globalTools.list()) {
      merged.register(t)
    }
    for (const t of agent.tools ?? []) {
      merged.register(t)
    }
    return merged
  }

  private async runTask(task: Task, pending: PendingRun): Promise<void> {
    const agent = this.agents.get(task.agentId)
    if (!agent) {
      const result: TaskResult = {
        taskId: task.id,
        agentId: task.agentId,
        output: '',
        turns: 0,
        durationMs: 0,
        status: 'error',
        error: `Unknown agent: ${task.agentId}`,
      }
      this.failPending(pending, result)
      return
    }

    this.emitKernelEvent({ type: 'task:started', taskId: task.id, agentId: task.agentId })

    const sessionId = task.sessionId ?? randomUUID()
    const memory = createMemoryStore(agent.memory ?? { type: 'ephemeral' }, {
      sessionId,
      sessionStores: this.sessionMemoryStores,
    })

    const mergedTools = this.mergeToolRegistry(agent)
    const toolMap = new Map<string, ToolDefinition>()
    for (const t of mergedTools.list()) {
      toolMap.set(t.name, t)
    }

    const context: AgentContext = {
      agentId: agent.id,
      sessionId,
      memory,
      tools: toolMap,
      emit: (event: string, payload: unknown) => {
        if (event === 'tool:called') {
          const p = payload as { agentId: string; toolCall: import('@open-os/types').ToolCall }
          this.emitKernelEvent({
            type: 'tool:called',
            agentId: p.agentId,
            toolCall: p.toolCall,
          })
        }
      },
      log: (level, message, meta) => this.log(level, message, meta),
    }

    const timeoutMs = optionsTimeout(task, this.defaultTimeout, agent)
    const maxTurns = agent.maxTurns ?? 25

    try {
      const result = await this.executor.execute(
        agent,
        task,
        context,
        mergedTools,
        { maxTurns, timeoutMs },
      )
      this.pending.delete(task.id)
      if (result.status === 'success') {
        this.completedTasks++
      } else {
        this.failedTasks++
        this.emitKernelEvent({
          type: 'task:failed',
          taskId: task.id,
          error: result.error ?? result.output,
        })
      }
      this.emitKernelEvent({ type: 'task:completed', result })
      pending.resolve(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const result: TaskResult = {
        taskId: task.id,
        agentId: task.agentId,
        output: '',
        turns: 0,
        durationMs: 0,
        status: 'error',
        error: message,
      }
      this.pending.delete(task.id)
      this.failedTasks++
      this.emitKernelEvent({ type: 'task:failed', taskId: task.id, error: message })
      this.emitKernelEvent({ type: 'task:completed', result })
      pending.resolve(result)
    }
  }

  private failPending(pending: PendingRun, result: TaskResult): void {
    this.pending.delete(pending.task.id)
    this.failedTasks++
    this.emitKernelEvent({
      type: 'task:failed',
      taskId: pending.task.id,
      error: result.error ?? 'failed',
    })
    this.emitKernelEvent({ type: 'task:completed', result })
    pending.resolve(result)
  }

  stats(): KernelStats {
    return {
      registeredAgents: this.agents.size,
      queuedTasks: this.scheduler.size(),
      runningTasks: this.activeTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      uptimeMs: Date.now() - this.startedAt,
    }
  }
}

function optionsTimeout(task: Task, defaultTimeout: number, agent: AgentDefinition): number {
  const fromMeta = task.metadata?.openosTimeout
  if (typeof fromMeta === 'number') return fromMeta
  if (agent.timeout !== undefined) return agent.timeout
  return defaultTimeout
}
