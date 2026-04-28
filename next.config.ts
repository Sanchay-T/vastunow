import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Allow server-side usage of Anthropic SDK
  serverExternalPackages: ['@anthropic-ai/sdk'],
};

export default nextConfig;
