import { source } from '@/lib/source'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) {
    notFound()
  }

  const MDX = page.data.body

  return (
    <article style={{ maxWidth: 820, padding: '32px 40px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 0 }}>
        {page.data.title}
      </h1>
      {page.data.description ? (
        <p style={{ color: 'var(--color-muted)', fontSize: 18, marginTop: 0 }}>{page.data.description}</p>
      ) : null}
      <div className="docsProse">
        <MDX />
      </div>
    </article>
  )
}

export function generateStaticParams(): Array<{ slug?: string[] }> {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) {
    notFound()
  }

  return {
    title: `${page.data.title} — OpenOS`,
    description: page.data.description,
  }
}
