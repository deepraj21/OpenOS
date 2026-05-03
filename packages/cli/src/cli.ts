#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { glob } from 'glob'
import chalk from 'chalk'
import { Command } from 'commander'
import ora from 'ora'
import prompts from 'prompts'
import { createOS } from '@openos/sdk'
import type { AgentDefinition } from '@openos/types'

const program = new Command()

program.name('openos').description('OpenOS CLI').version('0.0.1')

program
  .command('run')
  .argument('<agent-file>', 'Path to agent module (e.g. agents/web-researcher/index.ts)')
  .argument('<input>', 'Task input string')
  .action(async (agentFile: string, input: string) => {
    const abs = resolve(process.cwd(), agentFile)
    const spinner = ora('Running agent…').start()
    try {
      const mod = await importModule(abs)
      const agent = (mod.default ?? mod.agent) as AgentDefinition | undefined
      if (!agent || typeof agent !== 'object' || !('id' in agent)) {
        throw new Error('Agent file must export default AgentDefinition')
      }
      const os = createOS()
      os.use(agent)
      const result = await os.run(agent.id, input)
      spinner.stop()
      process.stdout.write(chalk.green('Done.\n'))
      process.stdout.write(JSON.stringify(result, null, 2) + '\n')
      if (result.status !== 'success') {
        process.exitCode = 1
      }
    } catch (err) {
      spinner.stop()
      const msg = err instanceof Error ? err.message : String(err)
      process.stderr.write(chalk.red(`Error: ${msg}\n`))
      process.exitCode = 1
    }
  })

program
  .command('list')
  .description('Scan for *.agent.ts and agents/**/index.ts')
  .action(async () => {
    const patterns = ['**/*.agent.ts', 'agents/**/index.ts']
    const files = new Set<string>()
    for (const p of patterns) {
      const hits = await glob(p, { ignore: ['node_modules/**', '**/dist/**', '**/apps/**'] })
      for (const h of hits) files.add(h)
    }
    if (files.size === 0) {
      process.stdout.write(chalk.yellow('No agent files found.\n'))
      return
    }
    for (const f of [...files].sort()) {
      try {
        const mod = await importModule(resolve(process.cwd(), f))
        const agent = (mod.default ?? mod.agent) as AgentDefinition | undefined
        if (!agent?.id) {
          process.stdout.write(chalk.dim(`${f} (no default export)\n`))
          continue
        }
        const provider = agent.model?.provider ?? '—'
        const tools = agent.tools?.length ?? 0
        process.stdout.write(
          `${chalk.bold(agent.name)} ${chalk.dim(`(${agent.id})`)} — ${provider} — ${tools} tools — ${f}\n`,
        )
      } catch {
        process.stdout.write(chalk.dim(`${f} (failed to load)\n`))
      }
    }
  })

program
  .command('init')
  .description('Scaffold my-agent.agent.ts')
  .action(async () => {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Agent display name',
      initial: 'My Agent',
    })
    if (!name) {
      process.stderr.write('Aborted.\n')
      process.exitCode = 1
      return
    }
    const { provider } = await prompts({
      type: 'select',
      name: 'provider',
      message: 'Model provider',
      choices: [
        { title: 'Anthropic', value: 'anthropic' },
        { title: 'OpenAI', value: 'openai' },
        { title: 'Ollama', value: 'ollama' },
      ],
      initial: 0,
    })
    if (!provider) {
      process.stderr.write('Aborted.\n')
      process.exitCode = 1
      return
    }
    const modelDefaults: Record<string, string> = {
      anthropic: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4o-mini',
      ollama: 'llama3.2',
    }
    const { model } = await prompts({
      type: 'text',
      name: 'model',
      message: 'Model name',
      initial: modelDefaults[String(provider)] ?? 'gpt-4o-mini',
    })
    if (!model) {
      process.stderr.write('Aborted.\n')
      process.exitCode = 1
      return
    }
    const id = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'my-agent'
    const source = `import { defineAgent } from '@openos/sdk'

export default defineAgent({
  id: '${id}',
  name: ${JSON.stringify(name)},
  description: 'Generated starter agent.',
  model: { provider: '${provider}', model: ${JSON.stringify(model)} },
  systemPrompt: \`You are a helpful assistant.\`,
})
`
    const out = resolve(process.cwd(), `${id}.agent.ts`)
    await writeFile(out, source, 'utf8')
    process.stdout.write(chalk.green(`Created ${out}\n`))
  })

async function importModule(absPath: string): Promise<Record<string, unknown>> {
  const { register } = await import('tsx/esm/api')
  register()
  const url = pathToFileURL(absPath).href
  return (await import(url)) as Record<string, unknown>
}

void program.parseAsync()
