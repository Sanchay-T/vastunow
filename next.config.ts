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
  // Allow server-side usage of AWS SDK
  serverExternalPackages: ['@aws-sdk/client-bedrock-runtime'],
};

export default nextConfig;
