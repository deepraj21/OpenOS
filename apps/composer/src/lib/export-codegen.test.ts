import { describe, expect, it } from 'vitest'
import type { ComposerGraph } from './composer-graph.js'
import { COMPOSER_GRAPH_VERSION } from './composer-graph.js'
import { generateComposeTsModule } from './export-codegen.js'

describe('generateComposeTsModule', () => {
  it('embeds graph and lists agent ids in TODO', () => {
    const graph: ComposerGraph = {
      version: COMPOSER_GRAPH_VERSION,
      nodes: [
        {
          id: 'n1',
          position: { x: 0, y: 0 },
          data: { label: 'A', agentId: 'alpha-agent' },
        },
      ],
      edges: [],
    }
    const src = generateComposeTsModule(graph)
    expect(src).toContain('COMPOSER_GRAPH')
    expect(src).toContain('alpha-agent')
    expect(src).toContain('createComposedOs')
  })
})
