import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Opsionet e konfigurimit */
  
  // Aktivizon React Compiler për performancë më të lartë (React 19)
  experimental: {
    reactCompiler: true,
  },

  // Ky opsion ndihmon që Next.js të punojë më mirë me deploy-et në Netlify/Vercel
  typescript: {
    // Lejon deploy-in edhe nëse ka gabime të vogla tipash (opsionale)
    ignoreBuildErrors: false, 
  },
  
  eslint: {
    // Kontrollon kodin për gabime gjatë build-it
    ignoreDuringBuilds: false,
  },

  // Optimizon renderimin
  reactStrictMode: true,
};

export default nextConfig;