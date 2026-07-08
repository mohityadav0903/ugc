import type { NextConfig } from 'next';

const serverOrigin = process.env.UGC_SERVER_ORIGIN ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@ugc/types'],
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${serverOrigin}/api/:path*` },
      { source: '/videos/:path*', destination: `${serverOrigin}/videos/:path*` },
    ];
  },
};

export default nextConfig;
