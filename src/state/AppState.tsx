"use client";
// ─────────────────────────────────────────────
// SkillSnap — Centralized App State
// Auth: hydrated from Supabase session on mount.
// onAuthStateChange keeps session in sync.
// ─────────────────────────────────────────────
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import type { User, Post, MessageThread, Message, Screen } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { getSupabase, getAuthSupabase } from "@/lib/supabase";
import { mapProfile, ensureProfile } from "@/services/authService";

// ── State Shape ──────────────────────────────
interface AppStateShape {
  currentUser: User | null;
  isAuthenticated: boolean;
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
  threadMessages: Record<string, Message[]>; // cached messages keyed by threadId

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
  | { type: "SET_THREAD_MESSAGES"; threadId: string; messages: Message[] }
  | { type: "MERGE_THREAD_MESSAGES"; threadId: string; messages: Message[] }
  | { type: "APPEND_THREAD_MESSAGE"; threadId: string; message: Message }
  | { type: "APPEND_THREAD_MESSAGE_IF_NEW"; threadId: string; message: Message }
  | { type: "PATCH_THREAD_MESSAGE"; threadId: string; optimisticId: string; message: Message }
  | { type: "INCREMENT_THREAD_UNREAD"; threadId: string }
  | { type: "PREPEND_POST"; post: Post }
  | { type: "DELETE_POST"; postId: string }
  | { type: "UPDATE_POST"; postId: string; patch: Partial<Pick<Post, "caption" | "skill" | "location">> }
  | { type: "SHOW_AUTH_PROMPT" }
  | { type: "HIDE_AUTH_PROMPT" };

// ── Initial State ────────────────────────────
const initialState: AppStateShape = {
  currentUser: null,
  isAuthenticated: false,
  authLoading: true, // start true — resolve on mount
  showAuthPrompt: false,
  screen: "landing", // always start here; useEffect corrects immediately
  previousScreen: null,
  posts: [],
  localPosts: [],
  feedLoading: false,
  feedVersion: 0,
  viewingUserId: null,
  threads: [],
  activeThreadId: null,
  activeThreadParticipantId: null,
  threadMessages: {},
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
        showAuthPrompt: false,
        authLoading: false,
        screen: (state.screen === "auth" || state.screen === "onboarding" || state.screen === "landing") ? "home" : state.screen,
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
    case "UPDATE_CURRENT_USER": {
      const patched = state.currentUser ? { ...state.currentUser, ...action.patch } : state.currentUser;
      const patchPosts = (posts: Post[]) =>
        posts.map(p =>
          p.authorId === patched?.id ? { ...p, author: { ...p.author, ...action.patch } } : p
        );
      return {
        ...state,
        currentUser: patched,
        posts: patchPosts(state.posts),
        localPosts: patchPosts(state.localPosts),
      };
    }
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
    case "SET_THREAD_MESSAGES":
      return {
        ...state,
        threadMessages: { ...state.threadMessages, [action.threadId]: action.messages },
      };
    // Merges DB messages into the cache without clobbering in-flight optimistic messages.
    // DB is authoritative for confirmed messages; optimistic/failed msgs only kept if not in DB.
    case "MERGE_THREAD_MESSAGES": {
      const existing = state.threadMessages[action.threadId] ?? [];
      const dbIds = new Set(action.messages.map((m) => m.id));
      // Keep only local messages not yet confirmed in DB (optimistic or failed)
      const localOnly = existing.filter(
        (m) => !dbIds.has(m.id) && (m.id.startsWith("optimistic_") || m.failed)
      );
      // Replace any optimistic messages that match a DB message by text+from
      const localDeduped = localOnly.filter((local) =>
        !action.messages.some((db) => db.from === "me" && db.text === local.text)
      );
      return {
        ...state,
        threadMessages: {
          ...state.threadMessages,
          [action.threadId]: [...action.messages, ...localDeduped],
        },
      };
    }
    case "APPEND_THREAD_MESSAGE": {
      const existing = state.threadMessages[action.threadId] ?? [];
      // Exact ID match — already have it
      if (existing.some((m) => m.id === action.message.id)) return state;
      // Realtime echo of our own sent message — replace the optimistic entry instead of duplicating
      if (action.message.from === "me") {
        const optimisticIdx = existing.findIndex(
          (m) => m.id.startsWith("optimistic_") && m.text === action.message.text
        );
        if (optimisticIdx !== -1) {
          const updated = [...existing];
          updated[optimisticIdx] = action.message;
          return {
            ...state,
            threadMessages: { ...state.threadMessages, [action.threadId]: updated },
          };
        }
      }
      return {
        ...state,
        threadMessages: { ...state.threadMessages, [action.threadId]: [...existing, action.message] },
      };
    }
    // Realtime path — only append if the message ID isn't already present
    case "APPEND_THREAD_MESSAGE_IF_NEW": {
      const existing = state.threadMessages[action.threadId] ?? [];
      if (existing.some((m) => m.id === action.message.id)) return state;
      // Replace matching optimistic entry for own echoed messages
      if (action.message.from === "me") {
        const idx = existing.findIndex(
          (m) => m.id.startsWith("optimistic_") && m.text === action.message.text
        );
        if (idx !== -1) {
          const updated = [...existing];
          updated[idx] = action.message;
          return { ...state, threadMessages: { ...state.threadMessages, [action.threadId]: updated } };
        }
      }
      return {
        ...state,
        threadMessages: { ...state.threadMessages, [action.threadId]: [...existing, action.message] },
      };
    }
    case "INCREMENT_THREAD_UNREAD":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId ? { ...t, unreadCount: (t.unreadCount ?? 0) + 1 } : t
        ),
      };
    case "PATCH_THREAD_MESSAGE": {
      const msgs = state.threadMessages[action.threadId] ?? [];
      return {
        ...state,
        threadMessages: {
          ...state.threadMessages,
          [action.threadId]: msgs.map((m) => m.id === action.optimisticId ? action.message : m),
        },
      };
    }
    case "PREPEND_POST":
      return {
        ...state,
        localPosts: [action.post, ...state.localPosts],
        posts: [action.post, ...state.posts],
      };
    case "DELETE_POST":
      return {
        ...state,
        localPosts: state.localPosts.filter((p) => p.id !== action.postId),
        posts: state.posts.filter((p) => p.id !== action.postId),
      };
    case "UPDATE_POST": {
      const patchPost = (p: Post) => p.id === action.postId ? { ...p, ...action.patch } : p;
      return {
        ...state,
        localPosts: state.localPosts.map(patchPost),
        posts: state.posts.map(patchPost),
      };
    }
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

let isExchangingCode = false;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate auth state from Supabase session on mount
  useEffect(() => {
    // Immediately check localStorage for existing session to prevent auth flash
    const existingSession = localStorage.getItem('sb-dnraeyxjzdmpdvrkzyfd-auth-token');
    if (existingSession) {
      try {
        const parsed = JSON.parse(existingSession);
        if (parsed?.user && parsed?.expires_at && parsed.expires_at * 1000 > Date.now()) {
          // Session looks valid — navigate away from auth/onboarding immediately
          // The full hydration below will confirm and load the profile
          dispatch({ type: "NAVIGATE", screen: "home" });
        }
      } catch {
        // Invalid JSON — ignore
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
      return;
    }

    // Use the auth client (always real URL) for session/auth operations.
    // The proxy client used for DB queries has a different storage key, which
    // causes getSession() to return null after an OAuth callback.
    const authSb = getAuthSupabase();
    const sb = getSupabase(); // used only for profile DB queries below

    // Safety net — if auth resolution hangs for >8s, stop the spinner
    const authTimeout = setTimeout(() => {
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
    }, 8000);

    async function hydrateProfile(userId: string, authUser: import("@supabase/supabase-js").User) {
      const { data } = await sb
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) {
        dispatch({ type: "SET_AUTH", user: mapProfile(data as Record<string, unknown>) });
      } else {
        const user = await ensureProfile(authUser);
        if (user) dispatch({ type: "SET_AUTH", user });
        else dispatch({ type: "SET_AUTH_LOADING", loading: false });
      }
    }

    // PKCE OAuth callback: if the URL contains ?code=, exchange it for a session
    // client-side. The code verifier was stored in localStorage by signInWithOAuth,
    // so only the browser client can complete this exchange — not the server route.
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get("code");
    if (oauthCode) {
      isExchangingCode = true;
      dispatch({ type: "SET_AUTH_LOADING", loading: true });
      window.history.replaceState({}, "", window.location.pathname);
      void (async () => {
        try {
          await authSb.auth.exchangeCodeForSession(oauthCode);
          // Brief delay so onAuthStateChange SIGNED_IN can fire and hydrate
          // the profile before the spinner clears — prevents flash to landing
          await new Promise(res => setTimeout(res, 500));
        } catch (e) {
          console.error("[AppState] exchangeCodeForSession threw:", e);
          dispatch({ type: "SET_AUTH_LOADING", loading: false });
        } finally {
          isExchangingCode = false;
        }
      })();
      return;
    }

    // Handle password reset callback — Supabase appends #access_token=...&type=recovery
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const recoveryType = hashParams.get("type");
    if (accessToken && recoveryType === "recovery") {
      window.history.replaceState({}, "", window.location.pathname);
      dispatch({ type: "NAVIGATE", screen: "reset-password" });
    }

    // Resolve initial session via getSession() — reads localStorage without acquiring
    // a lock. getUser() holds the lock for a full network round-trip, contending with
    // onAuthStateChange and causing 5000ms timeouts. INITIAL_SESSION from
    // onAuthStateChange below handles any session that arrives after this point.
    authSb.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(authTimeout);
      if (session?.user) {
        await hydrateProfile(session.user.id, session.user);
      } else {
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
      }
    }).catch(() => {
      clearTimeout(authTimeout);
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
    });

    // Keep session in sync across tabs, token refresh, and post-OAuth redirects.
    // INITIAL_SESSION fires when the page loads with an existing session (e.g. after
    // an OAuth callback redirect) — handle it so the user lands on home, not landing.
    const { data: { subscription } } = authSb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        dispatch({ type: "CLEAR_AUTH" });
      } else if (
        session &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")
      ) {
        await hydrateProfile(session.user.id, session.user);
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
