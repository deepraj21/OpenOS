import { Client } from '@modelcontextprotocol/sdk/client'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { AgentContext, ToolDefinition } from '@open-os/types'

/**
 * @description Configuration for connecting to an MCP server over stdio (spawned process).
 */
export interface McpStdioConnectOptions {
  /** Executable to spawn (e.g. `npx`) */
  command: string
  /** Arguments passed after the executable */
  args?: string[]
  /** Optional environment for the child process */
  env?: Record<string, string>
  /** Optional working directory */
  cwd?: string
  /** Prepended to each MCP tool name in OpenOS (default `mcp_`) */
  namePrefix?: string
}

/**
 * @description Handle returned after loading MCP tools; call `close()` when finished to tear down the process.
 */
export interface McpToolsHandle {
  tools: ToolDefinition[]
  /**
   * @description Closes the MCP client and transport.
   */
  close(): Promise<void>
}

function asToolParameters(inputSchema: {
  type?: string
  properties?: Record<string, object>
  required?: string[]
}): Record<string, unknown> {
  const o: Record<string, unknown> = {
    type: inputSchema.type ?? 'object',
    ...(inputSchema.properties !== undefined ? { properties: inputSchema.properties } : {}),
    ...(inputSchema.required !== undefined ? { required: inputSchema.required } : {}),
  }
  return o
}

/**
 * @description Connects to an MCP server via stdio, lists tools, and returns OpenOS `ToolDefinition` wrappers that forward `execute` to `tools/call`.
 * @param options Stdio spawn parameters and optional name prefix.
 * @returns Tools plus a `close` function to shut down the server process.
 * @example
 * ```typescript
 * const handle = await loadMcpTools({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-everything'] })
 * const agent = defineAgent({ id: 'demo', name: 'Demo', description: 'x', tools: handle.tools })
 * // …after use:
 * await handle.close()
 * ```
 */
export async function loadMcpTools(options: McpStdioConnectOptions): Promise<McpToolsHandle> {
  const transport = new StdioClientTransport({
    command: options.command,
    args: options.args,
    env: options.env,
    cwd: options.cwd,
  })
  const client = new Client({ name: 'open-os-mcp', version: '0.0.1' })
  await client.connect(transport)

  const listed = await client.listTools()
  const mcpTools = listed.tools ?? []
  const prefix = options.namePrefix ?? 'mcp_'

  const tools: ToolDefinition[] = mcpTools.map((t) => {
    const remoteName = t.name
    const openOsName = `${prefix}${remoteName}`
    return {
      name: openOsName,
      description: t.description ?? `MCP tool \`${remoteName}\``,
      parameters: asToolParameters(t.inputSchema),
      async execute(params: Record<string, unknown>, _context: AgentContext): Promise<unknown> {
        const result = await client.callTool({
          name: remoteName,
          arguments: params,
        })
        return result
      },
    }
  })

  return {
    tools,
    close: async () => {
      await transport.close()
    },
  }
}
