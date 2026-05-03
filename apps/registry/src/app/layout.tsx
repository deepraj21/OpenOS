import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenOS Registry',
  description: 'Discover and publish OpenOS agents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
