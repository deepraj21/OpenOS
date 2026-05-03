import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-section) 24px' }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 8vw, 72px)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          margin: 0,
        }}
      >
        OpenOS documentation
      </p>
      <p style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--color-muted)', marginTop: 24 }}>
        Editorial layout tokens follow <code>DESIGN.md</code> at the repository root. Product docs
        live on <Link href="/docs">/docs</Link> (Fumadocs + MDX).
      </p>
      <div style={{ marginTop: 48 }}>
        <Link
          href="/docs"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Browse docs
        </Link>
      </div>
    </main>
  )
}
