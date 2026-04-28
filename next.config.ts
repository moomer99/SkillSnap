import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/supabase/:path*",
        destination: "https://dnraeyxjzdmpdvrkzyfd.supabase.co/:path*",
      },
    ];
  },
} as NextConfig;

export default nextConfig;
