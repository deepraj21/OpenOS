import type { AgentContext, ToolDefinition } from '@openos/types'

/**
 * @description Creates a tool definition with typed execute handler.
 * @param config — Tool name, description, JSON Schema parameters, and execute.
 * @returns ToolDefinition compatible with the kernel.
 * @example
 * ```ts
 * const t = useTool({
 *   name: 'echo',
 *   description: 'Echo input',
 *   parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
 *   async execute({ text }) {
 *     return String(text)
 *   },
 * })
 * ```
 */
export function useTool<TParams extends Record<string, unknown>, TResult>(config: {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (params: TParams, context: AgentContext) => Promise<TResult>
}): ToolDefinition {
  return {
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    execute: (params, context) => config.execute(params as TParams, context),
  }
}
