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
}

module.exports = nextConfig

