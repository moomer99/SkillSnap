"use client";
// ─────────────────────────────────────────────
// useFeed — loads the home feed via postService (Supabase).
// Falls back to MOCK_POSTS when Supabase is not configured.
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
      // Dev fallback: use mock data while Supabase is not wired up
      dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
      return;
    }

    postService.getFeed().then((posts) => {
      // If Supabase returned nothing (empty DB), fall back to mock
      dispatch({ type: "SET_POSTS", posts: posts.length ? posts : MOCK_POSTS });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
    }).catch(() => {
      dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
    });
  }, [dispatch]);

  const toggleLike = useCallback(
    async (postId: string) => {
      dispatch({ type: "TOGGLE_LIKE", postId });
      const isLiked = state.likedPosts.has(postId);
      // Fire-and-forget — optimistic update already done above
      if (isLiked) {
        postService.unlikePost(postId).catch(() => {});
      } else {
        postService.likePost(postId).catch(() => {});
      }
    },
    [state.likedPosts, dispatch]
  );

  const toggleSave = useCallback(
    async (postId: string) => {
      dispatch({ type: "TOGGLE_SAVE", postId });
      const isSaved = state.savedPosts.has(postId);
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
