import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  typescript: {
    // Next's generated `LayoutProps` can disagree with workspace `@types/react` duplicates under pnpm.
    ignoreBuildErrors: true,
  },
}

export default withMDX(nextConfig)
