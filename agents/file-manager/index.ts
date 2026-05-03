import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { defineAgent, useMemory, useTool } from '@openos/sdk'

function safeResolve(userPath: string): string {
  const base = resolve(process.cwd())
  const target = resolve(base, userPath)
  if (!target.startsWith(base)) {
    throw new Error('Path escapes working directory')
  }
  return target
}

const listDirTool = useTool({
  name: 'list_dir',
  description: 'List files and directories in a path (non-recursive).',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string' } },
    required: ['path'],
  },
  async execute({ path }, context) {
    const p = safeResolve(String(path))
    const entries = await readdir(p, { withFileTypes: true })
    const mem = useMemory('ops', context.memory)
    await mem.set(`list-${Date.now()}`, { path: p, count: entries.length })
    return entries.map((e) => ({
      name: e.name,
      type: e.isDirectory() ? 'dir' : 'file',
    }))
  },
})

const readFileTool = useTool({
  name: 'read_file',
  description: 'Read a UTF-8 file.',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string' } },
    required: ['path'],
  },
  async execute({ path }, context) {
    const p = safeResolve(String(path))
    const content = await readFile(p, 'utf8')
    const mem = useMemory('ops', context.memory)
    await mem.set(`read-${Date.now()}`, { path: p })
    return { path: p, content: content.slice(0, 200_000) }
  },
})

const writeFileTool = useTool({
  name: 'write_file',
  description: 'Write UTF-8 text to a file (creates parent directories).',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
    },
    required: ['path', 'content'],
  },
  async execute({ path, content }, context) {
    const p = safeResolve(String(path))
    await mkdir(dirname(p), { recursive: true })
    await writeFile(p, String(content), 'utf8')
    const mem = useMemory('ops', context.memory)
    await mem.set(`write-${Date.now()}`, { path: p })
    return { ok: true, path: p }
  },
})

const moveFileTool = useTool({
  name: 'move_file',
  description: 'Move or rename a file within the working directory.',
  parameters: {
    type: 'object',
    properties: { from: { type: 'string' }, to: { type: 'string' } },
    required: ['from', 'to'],
  },
  async execute({ from, to }, context) {
    const a = safeResolve(String(from))
    const b = safeResolve(String(to))
    await mkdir(dirname(b), { recursive: true })
    await rename(a, b)
    const mem = useMemory('ops', context.memory)
    await mem.set(`move-${Date.now()}`, { from: a, to: b })
    return { ok: true, from: a, to: b }
  },
})

const createDirTool = useTool({
  name: 'create_dir',
  description: 'Create a directory (recursive).',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string' } },
    required: ['path'],
  },
  async execute({ path }, context) {
    const p = safeResolve(String(path))
    await mkdir(p, { recursive: true })
    const mem = useMemory('ops', context.memory)
    await mem.set(`mkdir-${Date.now()}`, { path: p })
    return { ok: true, path: p }
  },
})

const deleteFileTool = useTool({
  name: 'delete_file',
  description:
    'Soft-delete a file by moving it under .openos-trash/ in the working directory (no hard rm).',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string' } },
    required: ['path'],
  },
  async execute({ path }, context) {
    const p = safeResolve(String(path))
    const st = await stat(p)
    if (!st.isFile()) {
      return { error: 'delete_file only supports files' }
    }
    const base = process.cwd()
    const trash = join(base, '.openos-trash')
    await mkdir(trash, { recursive: true })
    const name = `${Date.now()}-${p.split('/').pop() ?? 'file'}`
    const dest = join(trash, name)
    await rename(p, dest)
    const mem = useMemory('ops', context.memory)
    await mem.set(`delete-${Date.now()}`, { from: p, trashPath: dest })
    return { ok: true, trashPath: dest }
  },
})

const modelName =
  process.env.OPENOS_ANTHROPIC_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022'

export default defineAgent({
  id: 'file-manager',
  name: 'File Manager',
  description: 'Efficient file operations assistant with soft deletes and operation memory.',
  model: { provider: 'anthropic', model: modelName },
  tools: [listDirTool, readFileTool, writeFileTool, moveFileTool, createDirTool, deleteFileTool],
  memory: { type: 'persistent', namespace: 'file-manager' },
  maxTurns: 15,
  systemPrompt: `You are a careful file operations assistant.

Rules:
- Confirm destructive intent in natural language before calling delete_file or overwrite-style writes when the user request is ambiguous.
- delete_file is soft-delete only (moves to .openos-trash).
- Never attempt to access paths outside the working directory.
- Summarize what you changed after each batch of operations.`,
})
