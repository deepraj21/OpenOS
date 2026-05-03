import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ToolDefinition } from '@openos/types'

vi.mock('@modelcontextprotocol/sdk/client', () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({
        tools: [
          {
            name: 'add',
            description: 'Add numbers',
            inputSchema: {
              type: 'object' as const,
              properties: { a: { type: 'number' }, b: { type: 'number' } },
              required: ['a', 'b'],
            },
          },
        ],
      }),
      callTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '3' }] }),
    })),
  }
})

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
  return {
    StdioClientTransport: vi.fn().mockImplementation(() => ({
      close: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

describe('loadMcpTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps MCP tools to ToolDefinition and forwards execute', async () => {
    const { loadMcpTools } = await import('./load-mcp-tools.js')
    const handle = await loadMcpTools({ command: 'echo', args: ['hi'] })
    expect(handle.tools).toHaveLength(1)
    const tool = handle.tools[0] as ToolDefinition
    expect(tool.name).toBe('mcp_add')
    const out = await tool.execute({ a: 1, b: 2 }, {} as never)
    expect(out).toEqual({ content: [{ type: 'text', text: '3' }] })
    await handle.close()
  })
})
