"use client";
// ─────────────────────────────────────────────
// SkillSnap — Centralized App State
// Uses React Context + useReducer pattern.
// Replace with Zustand / Redux Toolkit when complexity grows.
// ─────────────────────────────────────────────
import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { User, Post, MessageThread, Screen } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";

// ── State Shape ──────────────────────────────
interface AppStateShape {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Navigation
  screen: Screen;

  // Feed
  posts: Post[];
  feedLoading: boolean;

  // Profile context (which user we're viewing)
  viewingUserId: string | null;

  // Messages
  threads: MessageThread[];
  activeThreadId: string | null;

  // Discovery
  discoveryFilter: DiscoveryFilter;

  // UI
  likedPosts: Set<string>;
  savedPosts: Set<string>;
  followedUsers: Set<string>;
  modals: {
    jobsDoneInfo: boolean;
  };
}

// ── Actions ──────────────────────────────────
type Action =
  | { type: "SET_AUTH"; user: User }
  | { type: "CLEAR_AUTH" }
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
      return { ...state, currentUser: action.user, isAuthenticated: true };
    case "CLEAR_AUTH":
      return { ...initialState };
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
