import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://tokenry.tools/binance-token-creator',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
