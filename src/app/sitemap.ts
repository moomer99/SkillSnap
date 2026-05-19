import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://skillsnap.com.au",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
