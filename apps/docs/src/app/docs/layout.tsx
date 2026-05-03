import { source } from '@/lib/source'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pages = source.getPages()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: '1px solid var(--color-hairline)',
          padding: '20px 16px',
          background: '#fafafa',
        }}
      >
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-ink)' }}
        >
          OpenOS
        </Link>
        <nav className="docsNav" aria-label="Documentation">
          <ul>
            {pages.map((p) => (
              <li key={p.url}>
                <Link href={p.url}>{String(p.data.title ?? p.slugs.join('/'))}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}
