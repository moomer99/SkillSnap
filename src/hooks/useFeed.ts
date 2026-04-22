"use client";
// ─────────────────────────────────────────────
// useFeed — loads the home feed via postService (Supabase).
// Falls back to MOCK_POSTS only when Supabase is not configured.
// Seeds likedPosts/savedPosts in AppState from the DB response.
// ─────────────────────────────────────────────
import { useEffect, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { postService } from "@/services/postService";
import { MOCK_POSTS } from "@/mock-data/posts";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useFeed() {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    dispatch({ type: "SET_FEED_LOADING", loading: true });

    if (!SUPABASE_CONFIGURED) {
      // Dev mode — no Supabase credentials
      dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
      return;
    }

    postService
      .getFeed()
      .then(({ posts, likedIds, savedIds }) => {
        // Use real DB posts; only fall back to mock when the DB is genuinely empty
        dispatch({ type: "SET_POSTS", posts: posts.length ? posts : MOCK_POSTS });
        // Seed liked/saved interaction state from the DB so buttons render correctly
        dispatch({ type: "SET_INTERACTIONS", likedIds, savedIds });
        dispatch({ type: "SET_FEED_LOADING", loading: false });
      })
      .catch(() => {
        // Network/auth error — show mock so the feed isn't blank
        dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
        dispatch({ type: "SET_FEED_LOADING", loading: false });
      });
  }, [dispatch]);

  const toggleLike = useCallback(
    (postId: string) => {
      const isLiked = state.likedPosts.has(postId);
      // Optimistic update first
      dispatch({ type: "TOGGLE_LIKE", postId });
      // Fire-and-forget DB sync
      if (isLiked) {
        postService.unlikePost(postId).catch(() => {});
      } else {
        postService.likePost(postId).catch(() => {});
      }
    },
    [state.likedPosts, dispatch]
  );

  const toggleSave = useCallback(
    (postId: string) => {
      const isSaved = state.savedPosts.has(postId);
      dispatch({ type: "TOGGLE_SAVE", postId });
      if (isSaved) {
        postService.unsavePost(postId).catch(() => {});
      } else {
        postService.savePost(postId).catch(() => {});
      }
    },
    [state.savedPosts, dispatch]
  );

  return {
    posts: state.posts,
    loading: state.feedLoading,
    likedPosts: state.likedPosts,
    savedPosts: state.savedPosts,
    toggleLike,
    toggleSave,
  };
}
