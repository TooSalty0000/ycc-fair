import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Handle images and static assets
  images: {
    unoptimized: true
  }
};

export default nextConfig;
