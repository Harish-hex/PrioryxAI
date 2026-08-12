const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Default is 4.5MB — resumes can be larger
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse',
      'mammoth',
      'xlsx',
      'sharp',
      'canvas',
      'pdfjs-dist',
      'apify-client',
      'proxy-agent',
    ],
    // serverActionsBodySizeLimit is for Server Actions
    // For API routes, set in the route itself
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-icons',
      'framer-motion'
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  async headers() {
    return [
      {
        // Allow large file uploads on API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

export default nextConfig
