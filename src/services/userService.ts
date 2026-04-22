// ─────────────────────────────────────────────
// SkillSnap — User Service
// Integration point: swap for GET /users/:id, etc.
// ─────────────────────────────────────────────
import type { User } from "@/types";
import { MOCK_USERS, getUserById, MOCK_CURRENT_USER } from "@/mock-data/users";

export const userService = {
  async getUser(id: string): Promise<User | null> {
    // TODO: GET /users/:id
    return getUserById(id) ?? null;
  },

  async getCurrentUser(): Promise<User> {
    // TODO: GET /users/me (uses auth token)
    return MOCK_CURRENT_USER;
  },

  async searchUsers(query: string): Promise<User[]> {
    // TODO: GET /users/search?q=query
    const q = query.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.skill?.toLowerCase().includes(q)
    );
  },

  async followUser(_targetId: string): Promise<void> {
    // TODO: POST /users/:id/follow
  },

  async unfollowUser(_targetId: string): Promise<void> {
    // TODO: DELETE /users/:id/follow
  },

  async updateProfile(_patch: Partial<User>): Promise<User> {
    // TODO: PATCH /users/me
    return MOCK_CURRENT_USER;
  },
};
