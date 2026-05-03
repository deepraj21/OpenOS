import { FlowCanvas } from './FlowCanvas'

export default function ComposerPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Flow composer</strong>
          <div style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 4 }}>
            React Flow + graph JSON — use <strong>Export createOS() module</strong> to copy generated TypeScript.
          </div>
        </div>
        <span
          style={{
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #17171c',
            fontFamily: 'var(--font-display)',
          }}
        >
          DESIGN.md
        </span>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <FlowCanvas />
      </div>
    </div>
  )
}
