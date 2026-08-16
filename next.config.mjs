/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better perf
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Compress responses
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    minimumCacheTTL: 3600,
  },

  // Package import optimization
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
    ],
  },

  // Cache headers for static assets
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;