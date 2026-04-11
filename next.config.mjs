/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["apify-client", "proxy-agent", "pdf-parse", "mammoth"],
  },
};

export default nextConfig;
