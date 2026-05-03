import type {
  AgentContext,
  AgentDefinition,
  ModelConfig,
  Task,
  TaskResult,
  ToolCall,
} from '@openos/types'
import type { ChatMessage } from './adapters/types.js'
import type { LLMAdapter } from './adapters/types.js'
import { ToolRegistry } from './tool-registry.js'

export interface AgentExecutorDeps {
  getAdapter: (provider: NonNullable<ModelConfig['provider']>) => LLMAdapter
}

/**
 * @description Runs a single agent task: LLM loop with tool execution until completion or limits.
 */
export class AgentExecutor {
  constructor(private readonly deps: AgentExecutorDeps) {}

  async execute(
    agent: AgentDefinition,
    task: Task,
    context: AgentContext,
    toolRegistry: ToolRegistry,
    limits: { maxTurns: number; timeoutMs: number },
  ): Promise<TaskResult> {
    const started = Date.now()
    const taskId = task.id
    const agentId = task.agentId

    if (!agent.model) {
      return {
        taskId,
        agentId,
        output: '',
        turns: 0,
        durationMs: Date.now() - started,
        status: 'error',
        error: 'Agent has no model configuration',
      }
    }

    const messages: ChatMessage[] = []
    if (agent.systemPrompt) {
      messages.push({ role: 'system', content: agent.systemPrompt })
    }
    messages.push({
      role: 'user',
      content: typeof task.input === 'string' ? task.input : JSON.stringify(task.input),
    })

    const toolList = [...context.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }))

    const modelPayload: ModelConfig & {
      _openosTools?: typeof toolList
    } = {
      ...agent.model,
      _openosTools: toolList.length ? toolList : undefined,
    }

    let turns = 0
    let tokensUsed = 0
    const toolCallsAcc: ToolCall[] = []
    const deadline = Date.now() + limits.timeoutMs
    const maxTurns = limits.maxTurns

    try {
      const adapter = this.deps.getAdapter(agent.model.provider)

      while (turns < maxTurns) {
        if (Date.now() > deadline) {
          return {
            taskId,
            agentId,
            output: 'Task timed out',
            toolCalls: toolCallsAcc.length ? toolCallsAcc : undefined,
            turns,
            durationMs: Date.now() - started,
            tokensUsed,
            status: 'timeout',
          }
        }

        turns++
        const resp = await adapter.complete(messages, modelPayload)
        tokensUsed += resp.tokensUsed ?? 0

        if (!resp.toolCalls?.length) {
          return {
            taskId,
            agentId,
            output: resp.content,
            toolCalls: toolCallsAcc.length ? toolCallsAcc : undefined,
            turns,
            durationMs: Date.now() - started,
            tokensUsed,
            status: 'success',
          }
        }

        messages.push({
          role: 'assistant',
          content: resp.content,
          toolCalls: resp.toolCalls,
        })

        for (const tc of resp.toolCalls) {
          const { result, toolCall } = await toolRegistry.execute(
            tc.name,
            tc.params ?? {},
            context,
          )
          toolCallsAcc.push(toolCall)
          context.emit('tool:called', { agentId: context.agentId, toolCall })

          messages.push({
            role: 'tool',
            content: typeof result === 'string' ? result : JSON.stringify(result),
            toolCallId: tc.id,
            name: tc.name,
          })
        }
      }

      return {
        taskId,
        agentId,
        output: 'Max turns exceeded',
        toolCalls: toolCallsAcc.length ? toolCallsAcc : undefined,
        turns,
        durationMs: Date.now() - started,
        tokensUsed,
        status: 'error',
        error: 'Max turns exceeded',
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        taskId,
        agentId,
        output: '',
        toolCalls: toolCallsAcc.length ? toolCallsAcc : undefined,
        turns,
        durationMs: Date.now() - started,
        tokensUsed,
        status: 'error',
        error: message,
      }
    }
  }
}
