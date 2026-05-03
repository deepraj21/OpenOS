import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { glob } from 'glob'
import { defineAgent, useTool } from '@open-os/sdk'

const ALLOWED = new Set(['ls', 'pwd', 'echo', 'head', 'wc', 'git'])

const readFileTool = useTool({
  name: 'read_file',
  description: 'Read a UTF-8 text file from disk (relative paths resolved from cwd).',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string' } },
    required: ['path'],
  },
  async execute({ path }) {
    const p = resolve(process.cwd(), String(path))
    const text = await readFile(p, 'utf8')
    return { path: p, content: text.slice(0, 200_000) }
  },
})

const listFilesTool = useTool({
  name: 'list_files',
  description: 'List files matching a glob pattern (e.g. packages/sdk/src/**/*.ts).',
  parameters: {
    type: 'object',
    properties: { pattern: { type: 'string' } },
    required: ['pattern'],
  },
  async execute({ pattern }) {
    const files = await glob(String(pattern), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      nodir: true,
    })
    return files.slice(0, 200)
  },
})

const runCommandTool = useTool({
  name: 'run_command',
  description: 'Run an allowlisted read-only shell command with arguments.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Base command (e.g. ls, git)' },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arguments (no shell metacharacters required)',
      },
    },
    required: ['command'],
  },
  async execute({ command, args }) {
    const cmd = String(command)
    if (!ALLOWED.has(cmd)) {
      return { error: `Command not allowlisted: ${cmd}` }
    }
    const argv = (args as string[] | undefined) ?? []
    return new Promise((resolvePromise) => {
      const c = spawn(cmd, argv, {
        cwd: process.cwd(),
        shell: false,
        env: process.env,
      })
      let out = ''
      let err = ''
      c.stdout.on('data', (d) => {
        out += String(d)
      })
      c.stderr.on('data', (d) => {
        err += String(d)
      })
      c.on('close', (code) => {
        resolvePromise({
          command: [cmd, ...argv].join(' '),
          code,
          stdout: out.slice(0, 50_000),
          stderr: err.slice(0, 20_000),
        })
      })
    })
  },
})

const modelName =
  process.env.OPENOS_ANTHROPIC_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022'

export default defineAgent({
  id: 'code-reviewer',
  name: 'Code Reviewer',
  description: 'Reviews a file or directory for correctness, security, performance, and maintainability.',
  model: { provider: 'anthropic', model: modelName },
  tools: [readFileTool, listFilesTool, runCommandTool],
  maxTurns: 12,
  systemPrompt: `You are a senior engineer doing a structured code review.

Output sections:
- Summary
- Findings table with columns: severity (info|warn|error), area, file, recommendation
- Security notes
- Performance notes
- Maintainability notes

Use tools to inspect the repository. Prefer reading files over running commands. When you run commands, only use the allowlisted commands.`,
})
