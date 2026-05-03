import type { AgentDefinition } from '@openos/types'

/**
 * @description Validates and returns an agent definition (typed factory).
 * @param config — Full agent definition.
 * @returns The same definition after basic validation.
 * @example
 * ```ts
 * const agent = defineAgent({
 *   id: 'demo',
 *   name: 'Demo',
 *   description: 'A demo agent',
 * })
 * ```
 */
export function defineAgent(config: AgentDefinition): AgentDefinition {
  if (!config.id?.trim()) {
    throw new Error('defineAgent: id is required')
  }
  if (!config.name?.trim()) {
    throw new Error('defineAgent: name is required')
  }
  if (!config.description?.trim()) {
    throw new Error('defineAgent: description is required')
  }
  return {
    maxTurns: 25,
    ...config,
  }
}
