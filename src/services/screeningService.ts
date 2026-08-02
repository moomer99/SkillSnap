import { getAuthSupabase } from "@/lib/supabase";

/**
 * Proactive screening of media at upload time.
 *
 * The native app owns the richer version of this - it samples a ladder of
 * frames out of every video. The browser has no equivalent to hand without
 * seeking a <video> into a canvas, so the web path screens photos from their
 * uploaded URLs plus the single poster frame the composer already generates.
 *
 * That is weaker coverage, and deliberately so for now: without this call the
 * database trigger that holds every new post would leave web uploads invisible
 * forever. Full browser-side frame sampling is a follow-up.
 */

export type ScreeningVerdict = "approved" | "held";

/** Strips the `data:image/jpeg;base64,` prefix Vision will not accept. */
function toBase64(dataUrl: string): string | null {
  const comma = dataUrl.indexOf(",");
  return comma === -1 ? null : dataUrl.slice(comma + 1);
}

/**
 * Screens a post that is already saved and already invisible.
 *
 * Only ever promotes. Every failure path leaves the post held for manual
 * review, so this never throws into the publish flow.
 */
export async function screenPost(params: {
  postId: string;
  imageUrls: string[];
  thumbnailDataUrl?: string;
}): Promise<ScreeningVerdict> {
  const frames: string[] = [];
  if (params.thumbnailDataUrl) {
    const frame = toBase64(params.thumbnailDataUrl);
    if (frame) frames.push(frame);
  }

  try {
    const { data, error } = await getAuthSupabase().functions.invoke("moderate-post", {
      body: {
        post_id: params.postId,
        image_urls: params.imageUrls,
        frames,
      },
    });

    if (error) {
      console.error("[screening] failed:", error.message);
      return "held";
    }

    return data?.verdict === "approved" ? "approved" : "held";
  } catch (e) {
    console.error("[screening] threw:", e);
    return "held";
  }
}
