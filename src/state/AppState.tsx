"use client";
// ─────────────────────────────────────────────
// SkillSnap — Centralized App State
// Auth: hydrated from Supabase session on mount.
// onAuthStateChange keeps session in sync.
// ─────────────────────────────────────────────
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import type { User, Post, MessageThread, Screen } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "@/services/authService";

// ── State Shape ──────────────────────────────
interface AppStateShape {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean; // true while session is being resolved on mount

  screen: Screen;

  posts: Post[];
  feedLoading: boolean;

  viewingUserId: string | null;

  threads: MessageThread[];
  activeThreadId: string | null;

  discoveryFilter: DiscoveryFilter;

  likedPosts: Set<string>;
  savedPosts: Set<string>;
  followedUsers: Set<string>;
  modals: { jobsDoneInfo: boolean };
}

// ── Actions ──────────────────────────────────
type Action =
  | { type: "SET_AUTH"; user: User }
  | { type: "CLEAR_AUTH" }
  | { type: "SET_AUTH_LOADING"; loading: boolean }
  | { type: "NAVIGATE"; screen: Screen }
  | { type: "SET_POSTS"; posts: Post[] }
  | { type: "SET_FEED_LOADING"; loading: boolean }
  | { type: "SET_VIEWING_USER"; userId: string }
  | { type: "SET_THREADS"; threads: MessageThread[] }
  | { type: "SET_ACTIVE_THREAD"; threadId: string }
  | { type: "SET_DISCOVERY_FILTER"; filter: DiscoveryFilter }
  | { type: "TOGGLE_LIKE"; postId: string }
  | { type: "TOGGLE_SAVE"; postId: string }
  | { type: "TOGGLE_FOLLOW"; userId: string }
  | { type: "OPEN_JOBS_DONE_MODAL" }
  | { type: "CLOSE_JOBS_DONE_MODAL" };

// ── Initial State ────────────────────────────
const initialState: AppStateShape = {
  currentUser: null,
  isAuthenticated: false,
  authLoading: true, // start true — resolve on mount
  screen: "auth",
  posts: [],
  feedLoading: false,
  viewingUserId: null,
  threads: [],
  activeThreadId: null,
  discoveryFilter: "All",
  likedPosts: new Set(),
  savedPosts: new Set(),
  followedUsers: new Set(),
  modals: { jobsDoneInfo: false },
};

// ── Reducer ──────────────────────────────────
function appReducer(state: AppStateShape, action: Action): AppStateShape {
  switch (action.type) {
    case "SET_AUTH":
      return {
        ...state,
        currentUser: action.user,
        isAuthenticated: true,
        authLoading: false,
        screen: state.screen === "auth" ? "home" : state.screen,
      };
    case "CLEAR_AUTH":
      return { ...initialState, authLoading: false };
    case "SET_AUTH_LOADING":
      return { ...state, authLoading: action.loading };
    case "NAVIGATE":
      return { ...state, screen: action.screen };
    case "SET_POSTS":
      return { ...state, posts: action.posts };
    case "SET_FEED_LOADING":
      return { ...state, feedLoading: action.loading };
    case "SET_VIEWING_USER":
      return { ...state, viewingUserId: action.userId };
    case "SET_THREADS":
      return { ...state, threads: action.threads };
    case "SET_ACTIVE_THREAD":
      return { ...state, activeThreadId: action.threadId };
    case "SET_DISCOVERY_FILTER":
      return { ...state, discoveryFilter: action.filter };
    case "TOGGLE_LIKE": {
      const liked = new Set(state.likedPosts);
      liked.has(action.postId) ? liked.delete(action.postId) : liked.add(action.postId);
      return { ...state, likedPosts: liked };
    }
    case "TOGGLE_SAVE": {
      const saved = new Set(state.savedPosts);
      saved.has(action.postId) ? saved.delete(action.postId) : saved.add(action.postId);
      return { ...state, savedPosts: saved };
    }
    case "TOGGLE_FOLLOW": {
      const followed = new Set(state.followedUsers);
      followed.has(action.userId) ? followed.delete(action.userId) : followed.add(action.userId);
      return { ...state, followedUsers: followed };
    }
    case "OPEN_JOBS_DONE_MODAL":
      return { ...state, modals: { ...state.modals, jobsDoneInfo: true } };
    case "CLOSE_JOBS_DONE_MODAL":
      return { ...state, modals: { ...state.modals, jobsDoneInfo: false } };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────
interface AppContextValue {
  state: AppStateShape;
  dispatch: React.Dispatch<Action>;
  navigate: (screen: Screen) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate auth state from Supabase session on mount
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
      // Supabase not configured — skip auth and stay on auth screen
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
      return;
    }

    const sb = getSupabase();

    // Resolve initial session
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        sb.from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              dispatch({ type: "SET_AUTH", user: mapProfile(data as Record<string, unknown>) });
            } else {
              dispatch({ type: "SET_AUTH_LOADING", loading: false });
            }
          });
      } else {
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
      }
    });

    // Keep session in sync across tabs and token refresh
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        dispatch({ type: "CLEAR_AUTH" });
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const { data } = await sb
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data) {
          dispatch({ type: "SET_AUTH", user: mapProfile(data as Record<string, unknown>) });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function navigate(screen: Screen) {
    dispatch({ type: "NAVIGATE", screen });
  }

  return (
    <AppContext.Provider value={{ state, dispatch, navigate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}
