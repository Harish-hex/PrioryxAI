/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['framer-motion','lucide-react','recharts','@radix-ui/react-dialog','@radix-ui/react-select'],
    scrollRestoration: true,
  },
  async headers() {
    return [
      { source: '/(.*)', headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' },{ key: 'X-Content-Type-Options', value: 'nosniff' },{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }] },
      { source: '/_next/static/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/(logo|icon|logo-square)(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' },{ key: 'X-Accel-Buffering', value: 'no' }] },
    ];
  },
};
export default nextConfig;
