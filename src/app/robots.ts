import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/profile", "/chat", "/messages"],
    },
    sitemap: "https://skillsnap.com.au/sitemap.xml",
  };
}