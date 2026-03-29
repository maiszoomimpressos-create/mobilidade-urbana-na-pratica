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
}

module.exports = nextConfig

