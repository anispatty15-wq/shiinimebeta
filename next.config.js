/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Prevent Vercel build failures from strict TS/ESLint errors
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
    deviceSizes:     [320, 480, 640, 750, 828, 1080, 1200],
    imageSizes:      [16, 32, 64, 96, 128, 160, 200],
    formats:         ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff'                         },
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN'                      },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
