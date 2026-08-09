import { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const baseUrl = "https://skillsnap.com.au";

// Refresh the profile list hourly.
export const revalidate = 3600;

async function profileEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const sb = createPublicClient();
    // Only pros with at least one post are worth indexing.
    const { data, error } = await sb
      .from("profiles")
      .select("username, updated_at, post_count")
      .eq("role", "pro")
      .gt("post_count", 0)
      .order("jobs_done", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("[sitemap] profile query failed:", error.message);
      return [];
    }

    return ((data ?? []) as Array<{ username: string; updated_at: string | null }>)
      .filter((p) => !!p.username)
      .map((p) => ({
        url: `${baseUrl}/@${p.username}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch (e) {
    console.error("[sitemap] profile entries failed:", e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...(await profileEntries()),
  ];
}
