import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function RegistryHome() {
  const agents = await prisma.agent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px' }}>
      <header
        style={{
          padding: 32,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-deep-green)',
          color: 'var(--color-on-dark)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: 40 }}>Agent registry</h1>
        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Styled per <code>DESIGN.md</code> dark feature band. Data from Prisma (SQLite in local dev).
        </p>
      </header>
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Agents ({agents.length})</h2>
        {agents.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>
            No agents yet. Run <code>pnpm prisma migrate deploy</code> in apps/registry, then seed or
            publish from the CLI.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {agents.map((a) => (
              <li
                key={a.id}
                style={{
                  padding: 20,
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <strong>{a.name}</strong>
                <div style={{ color: 'var(--color-muted)', marginTop: 6 }}>{a.description}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
