import type { AgentContext, ToolCall, ToolDefinition } from '@openos/types'

export interface ToolExecuteResult {
  result: unknown
  toolCall: ToolCall
}

/**
 * @description Registry for tools with timing and error capture.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  unregister(name: string): void {
    this.tools.delete(name)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()]
  }

  /**
   * @description Executes a tool by name with timing; never throws — errors are encoded in the ToolCall result.
   */
  async execute(
    name: string,
    params: Record<string, unknown>,
    context: AgentContext,
  ): Promise<ToolExecuteResult> {
    const tool = this.tools.get(name)
    const started = Date.now()
    if (!tool) {
      const toolCall: ToolCall = {
        tool: name,
        params,
        result: { error: `Unknown tool: ${name}` },
        durationMs: Date.now() - started,
      }
      return { result: toolCall.result, toolCall }
    }
    try {
      const result = await tool.execute(params, context)
      const toolCall: ToolCall = {
        tool: name,
        params,
        result,
        durationMs: Date.now() - started,
      }
      return { result, toolCall }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const toolCall: ToolCall = {
        tool: name,
        params,
        result: { error: message },
        durationMs: Date.now() - started,
      }
      return { result: toolCall.result, toolCall }
    }
  }
}
