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
      dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
      return;
    }

    postService
      .getFeed()
      .then(({ posts, likedIds, savedIds }) => {
        dispatch({ type: "SET_POSTS", posts: posts.length ? posts : MOCK_POSTS });
        dispatch({ type: "SET_INTERACTIONS", likedIds, savedIds });
        dispatch({ type: "SET_FEED_LOADING", loading: false });
      })
      .catch(() => {
        dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
        dispatch({ type: "SET_FEED_LOADING", loading: false });
      });
  // feedVersion increments after a new post is created, triggering a reload
  }, [dispatch, state.feedVersion]);

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
