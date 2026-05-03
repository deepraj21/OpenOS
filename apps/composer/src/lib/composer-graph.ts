import type { Edge, Node } from '@xyflow/react'

/** Serialized composer document version. */
export const COMPOSER_GRAPH_VERSION = 1 as const

export interface ComposerNodeData {
  label: string
  /** Target OpenOS agent id (kebab-case), used for codegen hints */
  agentId: string
}

export interface ComposerGraphNode {
  id: string
  position: { x: number; y: number }
  data: ComposerNodeData
}

export interface ComposerGraphEdge {
  id: string
  source: string
  target: string
}

export interface ComposerGraph {
  version: typeof COMPOSER_GRAPH_VERSION
  nodes: ComposerGraphNode[]
  edges: ComposerGraphEdge[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * @description Builds a portable graph JSON from React Flow nodes/edges.
 */
export function graphFromFlow(nodes: Node[], edges: Edge[]): ComposerGraph {
  return {
    version: COMPOSER_GRAPH_VERSION,
    nodes: nodes.map((n) => ({
      id: n.id,
      position: { x: n.position.x, y: n.position.y },
      data: {
        label: typeof n.data?.label === 'string' ? n.data.label : n.id,
        agentId:
          typeof (n.data as unknown as ComposerNodeData | undefined)?.agentId === 'string'
            ? (n.data as unknown as ComposerNodeData).agentId
            : n.id,
      },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  }
}

/**
 * @description Validates unknown JSON as `ComposerGraph`.
 * @throws Error when invalid.
 */
export function parseComposerGraph(input: unknown): ComposerGraph {
  if (!isRecord(input)) {
    throw new Error('Graph must be an object')
  }
  if (input.version !== COMPOSER_GRAPH_VERSION) {
    throw new Error('Unsupported graph version')
  }
  const nodes = input.nodes
  const edges = input.edges
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error('Graph requires nodes[] and edges[]')
  }
  for (const n of nodes) {
    if (!isRecord(n) || typeof n.id !== 'string' || !isRecord(n.position)) {
      throw new Error('Invalid node')
    }
    if (!isRecord(n.data) || typeof n.data.agentId !== 'string') {
      throw new Error('Invalid node.data.agentId')
    }
  }
  for (const e of edges) {
    if (!isRecord(e) || typeof e.id !== 'string' || typeof e.source !== 'string' || typeof e.target !== 'string') {
      throw new Error('Invalid edge')
    }
  }
  return input as unknown as ComposerGraph
}
