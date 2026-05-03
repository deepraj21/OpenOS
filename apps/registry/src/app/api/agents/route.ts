import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/agents — list agents with optional `q` and `tag` query params.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const tag = searchParams.get('tag')?.trim()

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const filtered = agents.filter((a) => {
    if (q) {
      const hay = `${a.name} ${a.description}`.toLowerCase()
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
