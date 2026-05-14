"use client";
// ─────────────────────────────────────────────
// useProfile — resolves the correct user to display via userService (Supabase).
// Seeds followedUsers set in AppState from DB on first load.
// Optimistically updates follower count and follow state on toggle.
// Falls back to mock data when Supabase is not configured.
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
  // Track whether we've already seeded follow state this session
  const followsSeedKey = "followsSeedDone";

  // ── Resolve which user to display ────────────
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      if (variant === "own") {
        setUser(MOCK_CURRENT_USER);
      } else {
        const id = state.viewingUserId ?? "user_priya";
        setUser(MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[1]);
      }
      return;
    }

    if (variant === "own") {
      // Show cached user instantly, then refresh from DB for up-to-date counts
      if (state.currentUser) setUser(state.currentUser);
      userService.getCurrentUser().then((u) => {
        if (!u) return;
        setUser(u);
        dispatch({ type: "UPDATE_CURRENT_USER", patch: u });
      });
    } else {
      const id = state.viewingUserId;
      if (!id) return;
      userService.getUser(id).then((u) => {
        if (u) {
          setUser(u);
          return;
        }
        // Not in DB — try post author data as fallback
        const authorFromFeed = [...state.posts, ...state.localPosts]
          .find(p => p.authorId === id)?.author ?? null;
        if (authorFromFeed) {
          setUser(authorFromFeed);
          return;
        }
        // Nothing found anywhere — set a minimal placeholder so screen doesn't spin forever
        setUser({
          id,
          username: "@user",
          displayName: "SkillSnap User",
          avatarGradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
          avatarInitial: "S",
          location: "",
          bio: "",
          skill: null,
          isVerified: false,
          jobsDone: 0,
          happyPercent: 0,
          followers: 0,
          following: 0,
          postCount: 0,
          isClient: false,
          distanceKm: undefined,
        });
      });
    }
  // feedVersion triggers a re-fetch after uploads and job verifications
  }, [variant, state.viewingUserId, state.feedVersion]);

  // ── Seed follow state from DB once per session ─
  // Runs once per authenticated session using a window flag as a guard.
  // Always dispatches the result (even an empty set) so the Follow button
  // reflects real DB state regardless of whether the user has any follows.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    if (!state.isAuthenticated) return;
    if ((window as unknown as Record<string, unknown>)[followsSeedKey]) return;
    (window as unknown as Record<string, unknown>)[followsSeedKey] = true;
    userService.getFollowedUserIds().then((ids) => {
      dispatch({ type: "SET_FOLLOWED_USERS", userIds: ids });
    }).catch(() => {});
  // Only needs to run once — depend on auth state changing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  // ── Toggle follow with optimistic UI ─────────
  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!SUPABASE_CONFIGURED) {
        dispatch({ type: "TOGGLE_FOLLOW", userId });
        return;
      }

      const wasFollowing = state.followedUsers.has(userId);

      // 1. Optimistic update — flip button instantly
      dispatch({ type: "TOGGLE_FOLLOW", userId });

      // 2. Optimistically update the displayed follower count
      setUser((prev) => {
        if (!prev || prev.id !== userId) return prev;
        return { ...prev, followers: prev.followers + (wasFollowing ? -1 : 1) };
      });

      // 3. Persist to DB
      try {
        if (wasFollowing) {
          await userService.unfollowUser(userId);
        } else {
          await userService.followUser(userId);
        }
      } catch {
        // Rollback on failure
        dispatch({ type: "TOGGLE_FOLLOW", userId });
        setUser((prev) => {
          if (!prev || prev.id !== userId) return prev;
          return { ...prev, followers: prev.followers + (wasFollowing ? 1 : -1) };
        });
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
