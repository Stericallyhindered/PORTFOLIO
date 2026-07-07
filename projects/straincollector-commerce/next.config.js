/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/freshsnips',
        destination: '/fresh-snips',
        permanent: true,
      },
      {
        source: '/fresh_snips',
        destination: '/fresh-snips',
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'deliveries.myshippo.com',
      },
    ],
  },
};

module.exports = nextConfig;
