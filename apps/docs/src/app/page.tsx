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
        Editorial layout tokens follow <code>DESIGN.md</code> at the repository root (Cohere-inspired
        system: white canvas, deep green bands, pill CTAs). This site is the Phase 2 docs shell; extend
        with Fumadocs content sources when wiring MDX.
      </p>
      <section
        style={{
          marginTop: 48,
          padding: 32,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-soft-stone)',
        }}
      >
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Quick links</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>
            <a href="https://github.com">Kernel &amp; SDK live in packages/</a>
          </li>
          <li>
            <a href="/registry">Registry app (separate port in dev)</a>
          </li>
        </ul>
      </section>
      <div style={{ marginTop: 48 }}>
        <a
          href="https://github.com"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          View on GitHub
        </a>
      </div>
    </main>
  )
}
