export { defineAgent } from './define-agent.js'
export { useTool } from './use-tool.js'
export { useMemory } from './use-memory.js'
export { createOS } from './create-os.js'
export type { CreateOSOptions, CreateOSResult } from './create-os.js'

export { loadMcpTools, type McpStdioConnectOptions, type McpToolsHandle } from '@openos/mcp'
export {
  a2aDelegateRun,
  a2aJsonRpcCall,
  createA2aDelegateTool,
  fetchAgentCard,
  resolveJsonRpcUrl,
  type AgentCard,
  type A2aDelegateOptions,
  type A2aRemoteToolConfig,
} from '@openos/a2a'

export type {
  AgentContext,
  AgentDefinition,
  KernelConfig,
  MemoryConfig,
  MemoryStore,
  ModelConfig,
  Task,
  TaskResult,
  ToolCall,
  ToolDefinition,
} from '@openos/types'
