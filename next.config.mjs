/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  webpack: (config, { isServer }) => {
    // 1. Aktivizo eksperimentet për WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true, // E nevojshme për Next.js 15
    };

    // 2. Detyroje Webpack të përdorë tipin e saktë për skedarët .wasm
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // 3. Fix për libraritë që kërkojnë module Node.js në Browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;