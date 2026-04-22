// ─────────────────────────────────────────────
// SkillSnap — Search Service
// Integration point: swap for full-text search API
// (Algolia / Meilisearch / Postgres full-text)
// ─────────────────────────────────────────────
import type { User, Post } from "@/types";
import { MOCK_USERS } from "@/mock-data/users";
import { MOCK_POSTS } from "@/mock-data/posts";

export interface SearchResults {
  users: User[];
  posts: Post[];
}

export const searchService = {
  async search(query: string): Promise<SearchResults> {
    // TODO: GET /search?q=query
    const q = query.toLowerCase().trim();
    if (!q) return { users: [], posts: [] };

    const users = MOCK_USERS.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.skill?.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q)
    );

    const posts = MOCK_POSTS.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        p.author.skill?.toLowerCase().includes(q) ||
        p.author.location.toLowerCase().includes(q)
    );

    return { users, posts };
  },
};
