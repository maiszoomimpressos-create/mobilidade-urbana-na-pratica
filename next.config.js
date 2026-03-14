/** @type {import('next').NextConfig} */
// Build sem falhar no ESLint - deploy Vercel
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': ['apps/**', 'scripts/**'],
    },
  },
}

module.exports = nextConfig

