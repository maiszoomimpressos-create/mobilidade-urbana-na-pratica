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
  /** Evita bundling incorreto do sharp em API routes (Vercel / serverless). */
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },

  /** URLs antigas / erro de digitação (DevTools às vezes resume o path). */
  async rewrites() {
    return [
      { source: '/api/partner-ride-type', destination: '/api/partner/ride-types' },
      { source: '/api/partner-ride-type/:path*', destination: '/api/partner/ride-types/:path*' },
    ]
  },
}

module.exports = nextConfig

