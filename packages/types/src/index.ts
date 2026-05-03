/** Shared OpenOS runtime types. */

export interface AgentDefinition {
  id: string
  name: string
  description: string
  model?: ModelConfig
  tools?: ToolDefinition[]
  memory?: MemoryConfig
  systemPrompt?: string
  maxTurns?: number
  timeout?: number
  tags?: string[]
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom'
  model: string
  temperature?: number
  maxTokens?: number
  apiKey?: string
  baseURL?: string
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (params: Record<string, unknown>, context: AgentContext) => Promise<unknown>
}

export interface MemoryConfig {
  type: 'ephemeral' | 'persistent' | 'shared'
  namespace?: string
  maxItems?: number
  ttlMs?: number
}

export interface AgentContext {
  agentId: string
  sessionId: string
  memory: MemoryStore
  tools: Map<string, ToolDefinition>
  emit: (event: string, payload: unknown) => void
  log: (level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => void
}

export interface MemoryStore {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown, ttlMs?: number): Promise<void>
  delete(key: string): Promise<void>
  list(prefix?: string): Promise<string[]>
  clear(): Promise<void>
}

export interface Task {
  id: string
  agentId: string
  input: string | Record<string, unknown>
  priority?: number
  sessionId?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface TaskResult {
  taskId: string
  agentId: string
  output: string
  toolCalls?: ToolCall[]
  turns: number
  durationMs: number
  tokensUsed?: number
  status: 'success' | 'error' | 'timeout' | 'cancelled'
  error?: string
}

export interface ToolCall {
  tool: string
  params: Record<string, unknown>
  result: unknown
  durationMs: number
}

export type KernelEvent =
  | { type: 'task:queued'; task: Task }
  | { type: 'task:started'; taskId: string; agentId: string }
  | { type: 'task:completed'; result: TaskResult }
  | { type: 'task:failed'; taskId: string; error: string }
  | { type: 'agent:registered'; agentId: string }
  | { type: 'agent:unregistered'; agentId: string }
  | { type: 'tool:called'; agentId: string; toolCall: ToolCall }

export interface KernelConfig {
  maxConcurrentTasks?: number
  defaultTimeout?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
