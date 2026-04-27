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
import { mapProfile, ensureProfile } from "@/services/authService";

// ── State Shape ──────────────────────────────
interface AppStateShape {
  currentUser: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  authLoading: boolean; // true while session is being resolved on mount
  showAuthPrompt: boolean;

  screen: Screen;
  previousScreen: Screen | null;

  posts: Post[];
  localPosts: Post[]; // posts created locally (demo/offline) — persisted in memory
  feedLoading: boolean;
  feedVersion: number; // increment to trigger a feed reload

  viewingUserId: string | null;

  threads: MessageThread[];
  activeThreadId: string | null;
  activeThreadParticipantId: string | null;

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
  | { type: "SET_INTERACTIONS"; likedIds: Set<string>; savedIds: Set<string> }
  | { type: "REFRESH_FEED" }
  | { type: "SET_VIEWING_USER"; userId: string }
  | { type: "SET_THREADS"; threads: MessageThread[] }
  | { type: "SET_ACTIVE_THREAD"; threadId: string; participantId?: string }
  | { type: "SET_DISCOVERY_FILTER"; filter: DiscoveryFilter }
  | { type: "TOGGLE_LIKE"; postId: string }
  | { type: "TOGGLE_SAVE"; postId: string }
  | { type: "TOGGLE_FOLLOW"; userId: string }
  | { type: "SET_FOLLOWED_USERS"; userIds: Set<string> }
  | { type: "UPDATE_CURRENT_USER"; patch: Partial<User> }
  | { type: "OPEN_JOBS_DONE_MODAL" }
  | { type: "CLOSE_JOBS_DONE_MODAL" }
  | { type: "UPDATE_PARTICIPANT_HAPPY"; userId: string; happyPercent: number }
  | { type: "SET_THREAD_STARTED_AT"; threadId: string; startedAt: string }
  | { type: "PREPEND_POST"; post: Post }
  | { type: "SKIP_AUTH" }
  | { type: "SHOW_AUTH_PROMPT" }
  | { type: "HIDE_AUTH_PROMPT" };

// ── Initial State ────────────────────────────
const initialState: AppStateShape = {
  currentUser: null,
  isAuthenticated: false,
  isGuest: false,
  authLoading: true, // start true — resolve on mount
  showAuthPrompt: false,
  screen: "onboarding", // always start here; useEffect corrects immediately
  previousScreen: null,
  posts: [],
  localPosts: [],
  feedLoading: false,
  feedVersion: 0,
  viewingUserId: null,
  threads: [],
  activeThreadId: null,
  activeThreadParticipantId: null,
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
        isGuest: false,
        showAuthPrompt: false,
        authLoading: false,
        screen: (state.screen === "auth" || state.screen === "onboarding") ? "home" : state.screen,
      };
    case "CLEAR_AUTH":
      return { ...initialState, authLoading: false };
    case "SET_AUTH_LOADING":
      // If no session found and we're on onboarding, stay there
      return { ...state, authLoading: action.loading };
    case "NAVIGATE":
      return { ...state, previousScreen: state.screen, screen: action.screen };
    case "SET_POSTS": {
      // Always keep locally-created posts at the top so they survive feed reloads
      const remoteIds = new Set(action.posts.map((p) => p.id));
      const uniqueLocal = state.localPosts.filter((p) => !remoteIds.has(p.id));
      return { ...state, posts: [...uniqueLocal, ...action.posts] };
    }
    case "SET_FEED_LOADING":
      return { ...state, feedLoading: action.loading };
    case "REFRESH_FEED":
      return { ...state, feedVersion: state.feedVersion + 1 };
    case "SET_INTERACTIONS":
      return { ...state, likedPosts: action.likedIds, savedPosts: action.savedIds };
    case "SET_VIEWING_USER":
      return { ...state, viewingUserId: action.userId };
    case "SET_THREADS":
      return { ...state, threads: action.threads };
    case "SET_ACTIVE_THREAD":
      return {
        ...state,
        activeThreadId: action.threadId,
        activeThreadParticipantId: action.participantId ?? state.activeThreadParticipantId,
      };
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
    case "SET_FOLLOWED_USERS":
      return { ...state, followedUsers: action.userIds };
    case "UPDATE_CURRENT_USER":
      return {
        ...state,
        currentUser: state.currentUser ? { ...state.currentUser, ...action.patch } : state.currentUser,
      };
    case "OPEN_JOBS_DONE_MODAL":
      return { ...state, modals: { ...state.modals, jobsDoneInfo: true } };
    case "CLOSE_JOBS_DONE_MODAL":
      return { ...state, modals: { ...state.modals, jobsDoneInfo: false } };
    case "UPDATE_PARTICIPANT_HAPPY":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.participant.id === action.userId
            ? { ...t, participant: { ...t.participant, happyPercent: action.happyPercent } }
            : t
        ),
        // Also update currentUser if they are the target (shouldn't happen but guard)
        currentUser:
          state.currentUser?.id === action.userId
            ? { ...state.currentUser, happyPercent: action.happyPercent }
            : state.currentUser,
      };
    case "SET_THREAD_STARTED_AT":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId ? { ...t, startedAt: action.startedAt } : t
        ),
      };
    case "PREPEND_POST":
      return {
        ...state,
        localPosts: [action.post, ...state.localPosts],
        posts: [action.post, ...state.posts],
      };
    case "SKIP_AUTH":
      return {
        ...state,
        isGuest: true,
        authLoading: false,
        screen: "home",
      };
    case "SHOW_AUTH_PROMPT":
      return { ...state, showAuthPrompt: true };
    case "HIDE_AUTH_PROMPT":
      return { ...state, showAuthPrompt: false };
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
    // If user already completed onboarding, skip straight to auth before anything else
    if (localStorage.getItem("skillsnap_onboarded") === "1") {
      dispatch({ type: "NAVIGATE", screen: "auth" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
      return;
    }

    const sb = getSupabase();

    // Resolve initial session — create profile if it doesn't exist yet
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Try fetching existing profile first
        const { data } = await sb
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          dispatch({ type: "SET_AUTH", user: mapProfile(data as Record<string, unknown>) });
        } else {
          // Profile missing — create it from auth user metadata
          const user = await ensureProfile(session.user);
          if (user) {
            dispatch({ type: "SET_AUTH", user });
          } else {
            dispatch({ type: "SET_AUTH_LOADING", loading: false });
          }
        }
      } else {
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
      }
    });

    // Keep session in sync across tabs and token refresh
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        dispatch({ type: "CLEAR_AUTH" });
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Fetch or create profile for this session
        const { data } = await sb
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          dispatch({ type: "SET_AUTH", user: mapProfile(data as Record<string, unknown>) });
        } else {
          // First sign-in or profile missing — upsert from provider metadata
          const user = await ensureProfile(session.user);
          if (user) dispatch({ type: "SET_AUTH", user });
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
