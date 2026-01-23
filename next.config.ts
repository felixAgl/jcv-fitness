import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/jcv-fitness",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
