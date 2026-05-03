'use client'

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback } from 'react'
import { graphFromFlow } from '@/lib/composer-graph'
import { generateComposeTsModule } from '@/lib/export-codegen'

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: 'Agent A', agentId: 'agent-a' },
    type: 'default',
  },
  {
    id: '2',
    position: { x: 220, y: 120 },
    data: { label: 'Agent B', agentId: 'agent-b' },
    type: 'default',
  },
]

const initialEdges: Edge[] = []

function ExportToolbar() {
  const { getNodes, getEdges } = useReactFlow()

  const onExport = useCallback(async () => {
    const graph = graphFromFlow(getNodes(), getEdges())
    const ts = generateComposeTsModule(graph)
    try {
      await navigator.clipboard.writeText(ts)
      alert('TypeScript module copied to clipboard.')
    } catch {
      alert(`Clipboard unavailable. First lines of export:\n\n${ts.slice(0, 1200)}`)
    }
  }, [getEdges, getNodes])

  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
      <button type="button" onClick={() => void onExport()} style={{ cursor: 'pointer' }}>
        Export createOS() module
      </button>
    </div>
  )
}

function FlowCanvasInner() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ExportToolbar />
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
