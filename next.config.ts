import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/client/**/*'],
  },
  // Prisma バイナリを standalone output に含める
  outputFileTracingRoot: process.cwd(),
  // バレルインポートの自動最適化（ルール2.1: Avoid Barrel File Imports）
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
