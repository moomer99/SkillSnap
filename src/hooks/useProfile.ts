"use client";
// ─────────────────────────────────────────────
// useProfile — resolves the correct user to display
// based on variant + viewingUserId from AppState
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { userService } from "@/services/userService";
import type { User, ProfileVariant } from "@/types";

export function useProfile(variant: ProfileVariant) {
  const { state, dispatch } = useAppState();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (variant === "own") {
      userService.getCurrentUser().then(setUser);
    } else {
      // client variant — resolve via viewingUserId or fall back to first mock user
      const id = state.viewingUserId ?? "user_priya";
      userService.getUser(id).then((u) => setUser(u ?? null));
    }
  }, [variant, state.viewingUserId]);

  const toggleFollow = useCallback(
    async (userId: string) => {
      const isFollowing = state.followedUsers.has(userId);
      dispatch({ type: "TOGGLE_FOLLOW", userId });
      if (isFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
    },
    [state.followedUsers, dispatch]
  );

  const navigateToProfile = useCallback(
    (userId: string) => {
      dispatch({ type: "SET_VIEWING_USER", userId });
    },
    [dispatch]
  );

  return {
    user,
    isFollowing: user ? state.followedUsers.has(user.id) : false,
    toggleFollow,
    navigateToProfile,
  };
}
