import type { NextConfig } from "next";

const nextConfig: NextConfig = {
typescript:{
  ignoreBuildErrors: true
},
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },

  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
