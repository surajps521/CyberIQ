import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,   // ← disables double mount
  allowedDevOrigins: ['*'],
};

export default nextConfig;
