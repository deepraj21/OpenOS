import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenOS — Documentation',
  description: 'Developer SDK and runtime for agentic operating systems.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
