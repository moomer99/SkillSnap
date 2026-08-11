import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest and auto-linked by Next. theme/background
// match the site's dark theme (#0d0a1a); the icon artwork's own #050412 is
// close enough not to diverge the two.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkillSnap",
    short_name: "SkillSnap",
    description: "Watch. Trust. Connect. Sydney's skill marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0a1a",
    theme_color: "#0d0a1a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
