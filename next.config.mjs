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
    // No third-party scripts, iframes, or embedded checkout widgets exist
    // anywhere in this app (verified: no <iframe>, no window.Razorpay/new
    // Razorpay usage, no external <script src> — Razorpay is used via a
    // hosted payment-link redirect, not the embedded JS SDK) — so this CSP
    // can be genuinely strict rather than a permissive placeholder.
    // Next.js dev mode's Fast Refresh/HMR runtime evaluates hot-reloaded module
    // code via eval() — blocking 'unsafe-eval' breaks every client component in
    // `next dev` (page shell renders via SSR, but no client JS ever executes).
    // Production bundles never use eval(), so this stays strict in prod only.
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`, // Next.js's inline __NEXT_DATA__ and the theme-flash script in layout.tsx require 'unsafe-inline'; dev-only 'unsafe-eval' is for Fast Refresh
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.github.com https://www.hackerrank.com https://alfa-leetcode-api.onrender.com https://coding-profile-service.onrender.com wss://*.supabase.co",
      "frame-ancestors 'none'", // this site is never embedded in another page — blocks clickjacking
      "frame-src 'none'", // this site never embeds another page (no iframes anywhere)
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.razorpay.com",
    ].join('; ');

    const headers = [
      { source: '/(.*)', headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ] },
      { source: '/(logo|icon|logo-square)(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      // Default every API route to no-store — most routes are per-user/mutating
      // and must never be cached by a shared CDN. The few read-heavy, already
      // Redis-cached routes (feed/stats/user-status) override this with their
      // own `private` Cache-Control header on the response, which Next.js lets
      // a route handler set on its own NextResponse and which takes precedence
      // over this config-level default for that same response.
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
