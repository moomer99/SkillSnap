"use client";
// ─────────────────────────────────────────────
// useProfile — resolves the correct user to display via userService (Supabase).
// Falls back to MOCK_CURRENT_USER / MOCK_USERS when Supabase is not configured.
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { userService } from "@/services/userService";
import { MOCK_CURRENT_USER, MOCK_USERS } from "@/mock-data/users";
import type { User, ProfileVariant } from "@/types";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useProfile(variant: ProfileVariant) {
  const { state, dispatch } = useAppState();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      // Dev fallback
      if (variant === "own") {
        setUser(MOCK_CURRENT_USER);
      } else {
        const id = state.viewingUserId ?? "user_priya";
        setUser(MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[1]);
      }
      return;
    }

    if (variant === "own") {
      // Prefer AppState currentUser (already loaded) to avoid a round-trip
      if (state.currentUser) {
        setUser(state.currentUser);
      } else {
        userService.getCurrentUser().then((u) => setUser(u ?? MOCK_CURRENT_USER));
      }
    } else {
      const id = state.viewingUserId ?? "user_priya";
      userService.getUser(id).then((u) => setUser(u ?? MOCK_USERS[1]));
    }
  }, [variant, state.viewingUserId, state.currentUser]);

  const toggleFollow = useCallback(
    async (userId: string) => {
      const isFollowing = state.followedUsers.has(userId);
      dispatch({ type: "TOGGLE_FOLLOW", userId });
      if (SUPABASE_CONFIGURED) {
        if (isFollowing) {
          userService.unfollowUser(userId).catch(() => {});
        } else {
          userService.followUser(userId).catch(() => {});
        }
      }
    },
    [state.followedUsers, dispatch]
  );

  return {
    user,
    isFollowing: user ? state.followedUsers.has(user.id) : false,
    toggleFollow,
  };
}
