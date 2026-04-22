// ─────────────────────────────────────────────
// SkillSnap — Post / Feed Service
// Integration point: swap for GET /posts, POST /posts, etc.
// ─────────────────────────────────────────────
import type { Post } from "@/types";
import { MOCK_POSTS } from "@/mock-data/posts";

export const postService = {
  async getFeed(): Promise<Post[]> {
    // TODO: GET /feed (paginated)
    return MOCK_POSTS;
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    // TODO: GET /users/:id/posts
    return MOCK_POSTS.filter((p) => p.authorId === userId);
  },

  async likePost(_postId: string): Promise<void> {
    // TODO: POST /posts/:id/like
  },

  async unlikePost(_postId: string): Promise<void> {
    // TODO: DELETE /posts/:id/like
  },

  async savePost(_postId: string): Promise<void> {
    // TODO: POST /posts/:id/save
  },

  async unsavePost(_postId: string): Promise<void> {
    // TODO: DELETE /posts/:id/save
  },

  async getSavedPosts(_userId: string): Promise<Post[]> {
    // TODO: GET /users/:id/saved
    return MOCK_POSTS.filter((p) => p.savedByMe);
  },

  async sharePost(_postId: string): Promise<string> {
    // TODO: POST /posts/:id/share — returns share URL
    return "";
  },
};
