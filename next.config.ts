import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
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
  async headers() {
    return [
      {
        // The file has no extension, so nothing infers its type — Apple
        // requires application/json and ignores the file otherwise.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
} as NextConfig;

export default nextConfig;
