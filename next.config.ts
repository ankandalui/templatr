import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal configuration to avoid issues
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};
