"use client";
// ─────────────────────────────────────────────
// useFeed — paginated feed with infinite scroll.
// Loads 10 posts at a time from Supabase.
// Falls back to MOCK_POSTS only when Supabase is not configured.
// ─────────────────────────────────────────────
import { useEffect, useCallback, useRef, useState } from "react";
import { useAppState } from "@/state/AppState";
import { postService } from "@/services/postService";
import { MOCK_POSTS } from "@/mock-data/posts";
import { useLocation, distanceKm } from "@/hooks/useLocation";
import type { Post } from "@/types";

const PAGE_SIZE = 10;

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");


export function useFeed() {
  const { state, dispatch } = useAppState();
  const { location, radiusKm } = useLocation();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  // Track feedVersion so we reset when a new post is created
  const feedVersionRef = useRef(state.feedVersion);

  // Initial load / reset when feedVersion changes
  useEffect(() => {
    const isReset = feedVersionRef.current !== state.feedVersion;
    feedVersionRef.current = state.feedVersion;

    dispatch({ type: "SET_FEED_LOADING", loading: true });

    if (!SUPABASE_CONFIGURED) {
      dispatch({ type: "SET_POSTS", posts: MOCK_POSTS });
      dispatch({ type: "SET_FEED_LOADING", loading: false });
      setHasMore(false);
      return;
    }

    // Reset pagination on version bump
    if (isReset) offsetRef.current = 0;

    postService
      .getFeed(PAGE_SIZE, 0)
      .then(({ posts, likedIds, savedIds }) => {
        offsetRef.current = posts.length;
        setHasMore(posts.length === PAGE_SIZE);
        const filtered = (location?.lat && location?.lng)
          ? posts.filter(post => {
              const authorLat = post.author?.lat;
              const authorLng = post.author?.lng;
              if (!authorLat || !authorLng) return true;
              const dist = distanceKm(location.lat, location.lng, authorLat, authorLng);
              return dist <= radiusKm;
            })
          : posts;
        dispatch({ type: "SET_POSTS", posts: filtered });
        dispatch({ type: "SET_INTERACTIONS", likedIds, savedIds });
        dispatch({ type: "SET_FEED_LOADING", loading: false });
      })
      .catch(() => {
        dispatch({ type: "SET_FEED_LOADING", loading: false });
      });
  }, [dispatch, state.feedVersion, location?.lat, location?.lng, radiusKm]);

  // Re-filter already-loaded posts when location/radius changes without re-fetching
  useEffect(() => {
    if (!state.posts.length) return;
    dispatch({ type: "REFRESH_FEED" });
  }, [location?.lat, location?.lng, radiusKm]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !SUPABASE_CONFIGURED) return;
    setLoadingMore(true);
    try {
      const { posts: newPosts, likedIds, savedIds } = await postService.getFeed(PAGE_SIZE, offsetRef.current);
      if (newPosts.length === 0) {
        setHasMore(false);
        return;
      }
      offsetRef.current += newPosts.length;
      setHasMore(newPosts.length === PAGE_SIZE);
      const filteredNew = (location?.lat && location?.lng)
        ? newPosts.filter(post => {
            const authorLat = post.author?.lat;
            const authorLng = post.author?.lng;
            if (!authorLat || !authorLng) return true;
            const dist = distanceKm(location.lat, location.lng, authorLat, authorLng);
            return dist <= radiusKm;
          })
        : newPosts;
      const combined = [...state.posts, ...filteredNew.filter(p => !state.posts.some(e => e.id === p.id))];
      dispatch({ type: "SET_POSTS", posts: combined });
      dispatch({ type: "SET_INTERACTIONS", likedIds, savedIds });
    } catch {
      // silently fail — user can scroll again to retry
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, state.posts, dispatch]);

  const toggleLike = useCallback(
    (postId: string) => {
      const isLiked = state.likedPosts.has(postId);
      dispatch({ type: "TOGGLE_LIKE", postId });
      if (isLiked) postService.unlikePost(postId).catch(() => {});
      else postService.likePost(postId).catch(() => {});
    },
    [state.likedPosts, dispatch]
  );

  const toggleSave = useCallback(
    (postId: string) => {
      const isSaved = state.savedPosts.has(postId);
      dispatch({ type: "TOGGLE_SAVE", postId });
      if (isSaved) postService.unsavePost(postId).catch(() => {});
      else postService.savePost(postId).catch(() => {});
    },
    [state.savedPosts, dispatch]
  );

  return {
    posts: state.posts,
    loading: state.feedLoading,
    loadingMore,
    hasMore,
    loadMore,
    likedPosts: state.likedPosts,
    savedPosts: state.savedPosts,
    toggleLike,
    toggleSave,
  };
}
