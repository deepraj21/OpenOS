import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/agents/[slug]/versions/[version] — specific semver artifact.
 */
export async function GET(_request: Request, { params }: { params: { slug: string; version: string } }) {
  const { slug, version } = params

  const agent = await prisma.agent.findUnique({
    where: { slug },
  })

  if (!agent) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  const v = await prisma.agentVersion.findUnique({
    where: {
      agentId_version: {
        agentId: agent.id,
        version,
      },
    },
  })

  if (!v) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  let manifest: unknown = {}
  if (agent.packageJson) {
    try {
      manifest = JSON.parse(agent.packageJson) as unknown
    } catch {
      manifest = {}
    }
  }

  return NextResponse.json({
    slug: agent.slug,
    name: agent.name,
    description: agent.description,
    author: agent.author,
    tags: JSON.parse(agent.tags) as string[],
    version: v.version,
    code: v.code,
    manifest,
    publishedAt: v.publishedAt.toISOString(),
    changelog: v.changelog,
  })
}
