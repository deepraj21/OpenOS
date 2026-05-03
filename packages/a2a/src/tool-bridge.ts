import type { AgentContext, ToolDefinition } from '@open-os/types'
import { a2aDelegateRun } from './delegate.js'

export interface A2aRemoteToolConfig {
  /** OpenOS tool name exposed to the model */
  name: string
  description: string
  cardUrl: string
  rpcUrl?: string
}

/**
 * @description Wraps `a2aDelegateRun` as a `ToolDefinition` so remote A2A agents can be invoked like local tools.
 * @param config Tool metadata and card URL.
 * @returns A tool whose `execute` forwards `params.input` (string) to the remote agent.
 */
export function createA2aDelegateTool(config: A2aRemoteToolConfig): ToolDefinition {
  return {
    name: config.name,
    description: config.description,
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'User message to send to the remote A2A agent' },
      },
      required: ['input'],
    },
    async execute(params: Record<string, unknown>, _context: AgentContext): Promise<unknown> {
      const input = String(params.input ?? '')
      return a2aDelegateRun({
        cardUrl: config.cardUrl,
        rpcUrl: config.rpcUrl,
        input,
      })
    },
  }
}
