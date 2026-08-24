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
      { protocol: 'https', hostname: 'assets.leetcode.com' },
      { protocol: 'https', hostname: 'leetcode.com' },
      { protocol: 'https', hostname: '*.leetcode.com' },
      { protocol: 'https', hostname: 'hrcdn.net' },
      { protocol: 'https', hostname: '*.hackerrank.com' },
    ],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['framer-motion','lucide-react','recharts','@radix-ui/react-dialog','@radix-ui/react-select'],
    scrollRestoration: true,
    // apify-client's proxy-agent dependency picks its transport (http/https/socks/pac)
    // via a dynamic require() at runtime. Next.js's webpack server bundle can't
    // statically resolve that, so it silently drops the module and every Apify
    // (Internshala) call fails with "Cannot find module 'proxy-agent'". Keeping
    // apify-client external makes Next.js load it with Node's own require instead.
    serverComponentsExternalPackages: ['apify-client'],
  },
  async headers() {
    const headers = [
      { source: '/(.*)', headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' },{ key: 'X-Content-Type-Options', value: 'nosniff' },{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }] },
      { source: '/(logo|icon|logo-square)(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' },{ key: 'X-Accel-Buffering', value: 'no' }] },
    ];
    // Dev-mode chunk filenames (e.g. app/feed/page.js) aren't content-hashed the
    // way production build output is, so an immutable 1-year cache here makes
    // the browser keep serving pre-edit code after every save — every "why
    // isn't my change showing up" is this. Only safe to apply once filenames
    // are hashed, i.e. in production.
    if (process.env.NODE_ENV === 'production') {
      headers.push({ source: '/_next/static/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] });
    }
    return headers;
  },
};
export default nextConfig;
