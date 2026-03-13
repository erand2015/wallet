/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Kjo ndihmon shumë për deploy në Netlify/Vercel
  images: {
    unoptimized: true, // Duhet nëse përdorim 'output: export'
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;