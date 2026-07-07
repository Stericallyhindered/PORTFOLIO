/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['laserconsumables.com', 'cdn.shopify.com', 'via.placeholder.com', 'placehold.co', 'cdn.shopifycdn.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'laserconsumables.com',
      },
      {
        protocol: 'http',
        hostname: 'laserconsumables.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig





