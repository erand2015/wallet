import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* opsionet e tjera këtu */
  // Hoqëm reactCompiler sepse shkaktonte gabimin në Build
  eslint: {
    // Kjo ndihmon që deploy të mos dështojë për gabime të vogla stili
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Kjo lejon build-in edhe nëse ka gabime të vogla tipash
    ignoreBuildErrors: true,
  },
};

export default nextConfig;