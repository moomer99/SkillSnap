// ─────────────────────────────────────────────
// SkillSnap — Upload Service (Supabase Storage)
// Buckets required: "avatars" (public), "post-media" (public)
// Create in Supabase Storage UI or via migration.
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import type { Post, SkillCategory } from "@/types";

export interface UploadPayload {
  file?: File;
  caption: string;
  skill: SkillCategory | "";
  location: string;
}

export const uploadService = {
  // Upload media file to post-media bucket; returns public URL
  async uploadMedia(file: File): Promise<string> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${session.user.id}/${Date.now()}.${ext}`;

    const { error } = await sb.storage.from("post-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    const { data: urlData } = sb.storage.from("post-media").getPublicUrl(path);
    return urlData.publicUrl;
  },

  // Upload avatar image to avatars bucket; returns public URL
  async uploadAvatar(file: File): Promise<string> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${session.user.id}/avatar.${ext}`;

    const { error } = await sb.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true, // replace existing avatar
    });
    if (error) throw error;

    const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  },

  // Create a post record after media is uploaded
  async createPost(payload: UploadPayload): Promise<Post | null> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;

    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (payload.file) {
      try {
        mediaUrl = await uploadService.uploadMedia(payload.file);
        if (payload.file.type.startsWith("image/")) thumbnailUrl = mediaUrl;
      } catch {
        // Continue without media upload; can retry later
      }
    }

    const isVideo = payload.file?.type.startsWith("video/") ?? true;

    const { data, error } = await sb
      .from("posts")
      .insert({
        author_id: session.user.id,
        type: isVideo ? "video" : "photo",
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        thumbnail_gradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
        caption: payload.caption,
        skill: payload.skill || null,
        location: payload.location || null,
      })
      .select("*, profiles(*)")
      .single();

    if (error || !data) return null;

    // Insert into post_media for multi-media support
    if (mediaUrl) {
      await sb.from("post_media").insert({
        post_id: data.id,
        url: mediaUrl,
        type: isVideo ? "video" : "photo",
      });
    }

    const { mapPost } = await import("./postService");
    return mapPost(data as Record<string, unknown>, new Set(), new Set());
  },

  async importFromSocial(_platform: "instagram" | "tiktok" | "facebook"): Promise<void> {
    // TODO: OAuth flow to import media
  },
};
