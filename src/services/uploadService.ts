// ─────────────────────────────────────────────
// SkillSnap — Upload Service
// Integration point: swap for media storage API
// (Supabase Storage / S3 / Cloudinary)
// ─────────────────────────────────────────────
import type { Post, SkillCategory } from "@/types";
import { MOCK_CURRENT_USER } from "@/mock-data/users";

export interface UploadPayload {
  file?: File;
  caption: string;
  skill: SkillCategory | "";
  location: string;
}

export const uploadService = {
  async uploadMedia(_file: File): Promise<string> {
    // TODO: upload to storage bucket → return media URL
    return "/mock-media-url";
  },

  async createPost(payload: UploadPayload): Promise<Post> {
    // TODO: POST /posts { mediaUrl, caption, skill, location }
    return {
      id: `post_${Date.now()}`,
      authorId: MOCK_CURRENT_USER.id,
      author: MOCK_CURRENT_USER,
      type: "video",
      thumbnailGradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
      caption: payload.caption,
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      createdAt: new Date().toISOString(),
    };
  },

  async importFromSocial(_platform: "instagram" | "tiktok" | "facebook"): Promise<void> {
    // TODO: OAuth flow to import media
  },
};
