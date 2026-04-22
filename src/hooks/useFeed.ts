"use client";
// ─────────────────────────────────────────────
// useFeed — loads the home feed via postService,
// exposes like/save actions that dispatch to AppState
// ─────────────────────────────────────────────
import { useEffect, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { postService } from "@/services/postService";

export function useFeed() {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    dispatch({ type: "SET_FEED_LOADING", loading: true });
    postService.getFeed().then((posts) => {
      dispatch({ type: "SET_POSTS", posts });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
    });
  }, [dispatch]);

  const toggleLike = useCallback(
    async (postId: string) => {
      const isLiked = state.likedPosts.has(postId);
      dispatch({ type: "TOGGLE_LIKE", postId });
      if (isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    },
    [state.likedPosts, dispatch]
  );

  const toggleSave = useCallback(
    async (postId: string) => {
      const isSaved = state.savedPosts.has(postId);
      dispatch({ type: "TOGGLE_SAVE", postId });
      if (isSaved) {
        await postService.unsavePost(postId);
      } else {
        await postService.savePost(postId);
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
