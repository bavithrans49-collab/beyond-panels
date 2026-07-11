import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
