import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedToPublish, unauthorizedResponse } from '@/lib/registry-auth'
import { parsePublishBody } from '@/lib/publish-payload'

/**
 * GET /api/agents — list agents with optional `q`, `tag`, and `slug` query params.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const tag = searchParams.get('tag')?.trim()
  const slugFilter = searchParams.get('slug')?.trim()

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const filtered = agents.filter((a) => {
    if (slugFilter && a.slug !== slugFilter) {
      return false
    }
    if (q) {
      const hay = `${a.name} ${a.description} ${a.slug}`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    if (tag) {
      try {
        const tags = JSON.parse(a.tags) as string[]
        if (!Array.isArray(tags) || !tags.includes(tag)) return false
      } catch {
        return false
      }
    }
    return true
  })

  return NextResponse.json({ agents: filtered })
}

/**
 * POST /api/agents — publish a new agent version (requires auth when OPENOS_REGISTRY_API_KEYS is set).
 */
export async function POST(request: Request) {
  if (!isAuthorizedToPublish(request)) {
    return unauthorizedResponse()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let payload: ReturnType<typeof parsePublishBody>
  try {
    payload = parsePublishBody(body)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid body'
    return NextResponse.json({ error: msg, code: 'BAD_REQUEST' }, { status: 400 })
  }

  const slug = payload.manifest.id.toLowerCase()

  try {
    const result = await prisma.$transaction(async (tx) => {
      let agent = await tx.agent.findUnique({ where: { slug } })
      if (!agent) {
        agent = await tx.agent.create({
          data: {
            slug,
            name: payload.manifest.name,
            description: payload.manifest.description,
            version: payload.version,
            author: payload.author ?? 'unknown',
            tags: JSON.stringify(payload.manifest.tags ?? []),
            packageJson: JSON.stringify(payload.manifest),
          },
        })
      } else {
        agent = await tx.agent.update({
          where: { id: agent.id },
          data: {
            name: payload.manifest.name,
            description: payload.manifest.description,
            version: payload.version,
            ...(payload.author !== undefined ? { author: payload.author } : {}),
            tags: JSON.stringify(payload.manifest.tags ?? []),
            packageJson: JSON.stringify(payload.manifest),
          },
        })
      }

      const versionRow = await tx.agentVersion.create({
        data: {
          agentId: agent.id,
          version: payload.version,
          code: payload.code,
          changelog: payload.changelog ?? null,
        },
      })

      return { agent, versionRow }
    })

    return NextResponse.json(
      {
        ok: true,
        slug: result.agent.slug,
        version: result.versionRow.version,
        agentId: result.agent.id,
      },
      { status: 201 },
    )
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e !== null && 'code' in e
        ? String((e as { code?: string }).code)
        : ''
    if (code === 'P2002') {
      return NextResponse.json(
        { error: `Version ${payload.version} already exists for ${slug}`, code: 'DUPLICATE_VERSION' },
        { status: 409 },
      )
    }
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message, code: 'INTERNAL' }, { status: 500 })
  }
}
