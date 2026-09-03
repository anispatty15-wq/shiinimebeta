const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  sw: 'sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

  // ── Server-side redirects (instant, no JS needed) ─────────
  async redirects() {
    return [
      // Old episode routes → new stream routes
      {
        source:      '/anime/episode/:slug',
        destination: '/stream/anime/:slug',
        permanent:   false,
      },
      {
        source:      '/hentai/episode/:slug',
        destination: '/stream/hentai/:slug',
        permanent:   false,
      },
      // Old detail routes → new detail routes
      {
        source:      '/anime/:slug',
        destination: '/detail/anime/:slug',
        permanent:   false,
        has: [{ type: 'header', key: 'x-nextjs-data' }],  // only for navigation
      },
      {
        source:      '/hentai/:slug',
        destination: '/detail/hentai/:slug',
        permanent:   false,
        has: [{ type: 'header', key: 'x-nextjs-data' }],
      },
      {
        source:      '/comic/:slug',
        destination: '/detail/comic/:slug',
        permanent:   false,
        has: [{ type: 'header', key: 'x-nextjs-data' }],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = withPWA(nextConfig);
