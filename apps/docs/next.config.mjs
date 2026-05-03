import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** GitHub Pages project sites use `/<repo>`; leave unset for apex or user-site roots. */
const basePath = process.env.BASE_PATH?.replace(/\/$/, '') ?? ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  output: 'export',
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  typescript: {
    // Next's generated `LayoutProps` can disagree with workspace `@types/react` duplicates under pnpm.
    ignoreBuildErrors: true,
  },
}

export default withMDX(nextConfig)
