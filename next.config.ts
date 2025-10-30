import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/client/**/*'],
  },
  // Prisma バイナリを standalone output に含める
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
