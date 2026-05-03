import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenOS Composer',
  description: 'Visual flow composer for OpenOS agents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  )
}
