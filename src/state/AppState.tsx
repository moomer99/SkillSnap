"use client";
// ─────────────────────────────────────────────
// SkillSnap — Centralized App State
// Auth: hydrated from Supabase session on mount.
// onAuthStateChange keeps session in sync.
// ─────────────────────────────────────────────
import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";
import type { User, Post, MessageThread, Message, Screen } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { getAuthSupabase } from "@/lib/supabase";
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
  pendingJobsRequest: { jobId: string; fromName: string; notificationId: string } | null;
  unreadNotifCount: number;
  searchQuery: string;
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
  | { type: "CLEAR_ALL_THREAD_UNREAD" }
  | { type: "PREPEND_POST"; post: Post }
  | { type: "DELETE_POST"; postId: string }
  | { type: "UPDATE_POST"; postId: string; patch: Partial<Pick<Post, "caption" | "skill" | "location">> }
  | { type: "SHOW_AUTH_PROMPT" }
  | { type: "HIDE_AUTH_PROMPT" }
  | { type: "SET_PENDING_JOBS_REQUEST"; request: { jobId: string; fromName: string; notificationId: string } | null }
  | { type: "SET_UNREAD_NOTIF_COUNT"; count: number }
  | { type: "INCREMENT_UNREAD_NOTIF_COUNT" }
  | { type: "CLEAR_UNREAD_NOTIF_COUNT" }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "REMOVE_THREAD"; threadId: string }
  | { type: "CLEAR_THREADS" }
  | { type: "DELETE_MESSAGE"; msgId: string };

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
  pendingJobsRequest: null,
  unreadNotifCount: 0,
  searchQuery: "",
};

// ── Reducer ──────────────────────────────────
function appReducer(state: AppStateShape, action: Action): AppStateShape {
  switch (action.type) {
    case "SET_AUTH": {
      const needsRoleSetup = !action.user.role;
      const needsUsernameSetup = /@@?[a-z0-9_]+_[a-z0-9]{4}$/.test((action.user.username ?? "").toLowerCase());
      const comingFromAuthFlow = ["auth", "onboarding", "landing", "role-setup", "username-setup"].includes(state.screen);
      const nextScreen = comingFromAuthFlow
        ? (needsUsernameSetup ? "username-setup" : needsRoleSetup ? "role-setup" : "home")
        : state.screen;
      return {
        ...state,
        currentUser: action.user,
        isAuthenticated: true,
        showAuthPrompt: false,
        authLoading: false,
        screen: nextScreen,
      };
    }
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
    case "CLEAR_ALL_THREAD_UNREAD":
      return {
        ...state,
        threads: state.threads.map((t) => ({ ...t, unreadCount: 0 })),
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
    case "SET_PENDING_JOBS_REQUEST":
      return { ...state, pendingJobsRequest: action.request };
    case "SET_UNREAD_NOTIF_COUNT":
      return { ...state, unreadNotifCount: action.count };
    case "INCREMENT_UNREAD_NOTIF_COUNT":
      return { ...state, unreadNotifCount: state.unreadNotifCount + 1 };
    case "CLEAR_UNREAD_NOTIF_COUNT":
      return { ...state, unreadNotifCount: 0 };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };
    case "REMOVE_THREAD":
      return { ...state, threads: state.threads.filter(t => t.id !== action.threadId) };
    case "CLEAR_THREADS":
      return { ...state, threads: [] };
    case "DELETE_MESSAGE":
      return {
        ...state,
        threadMessages: {
          ...state.threadMessages,
          [state.activeThreadId ?? ""]: (
            state.threadMessages[state.activeThreadId ?? ""] ?? []
          ).filter(m => m.id !== action.msgId),
        },
      };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────
interface AppContextValue {
  state: AppStateShape;
  dispatch: React.Dispatch<Action>;
  navigate: (screen: Screen) => void;
  onlineUserIds: Set<string>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const hydratingRef = useRef<string | null>(null);
  usePresence(state.currentUser?.id ?? null);
  const onlineUserIds = new Set<string>();

  // Hydrate auth state from Supabase session on mount
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
      return;
    }

    const authSb = getAuthSupabase();

    // Safety net — if auth resolution hangs for >8s, stop the spinner
    const authTimeout = setTimeout(() => {
      console.warn("[AppState] auth resolution timed out after 8s");
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
    }, 8000);

    // hydrateProfile — fetches the profile row and dispatches SET_AUTH.
    // Falls back to ensureProfile (upsert) if the row doesn't exist yet,
    // which is the normal path for first-time Google OAuth login.
    async function hydrateProfile(userId: string, authUser: import("@supabase/supabase-js").User) {
      const timeoutId = setTimeout(() => {
        console.error("[AppState] hydrateProfile timed out");
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
      }, 8000);

      try {
        // Find the Supabase auth token regardless of the project-specific key name
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
        const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
        const tokenKey = `sb-${projectRef}-auth-token`;
        const tokenData = JSON.parse(localStorage.getItem(tokenKey) ?? "{}");
        // Also accept the token passed directly via setSession (implicit flow)
        const accessToken = tokenData?.access_token ?? tokenData?.session?.access_token;
        if (!accessToken) {
          try {
            const { data: { user } } = await authSb.auth.getUser();
            clearTimeout(timeoutId);
            if (user) {
              // Try fetching profile directly first
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`,
                {
                  headers: {
                    "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    "Authorization": `Bearer ${user.id}`,
                    "Content-Type": "application/json",
                  }
                }
              );
              // Fall back to ensureProfile which uses the authenticated client
              const profile = await ensureProfile(user);
              if (profile) dispatch({ type: "SET_AUTH", user: profile });
              else dispatch({ type: "SET_AUTH_LOADING", loading: false });
            } else {
              dispatch({ type: "SET_AUTH_LOADING", loading: false });
            }
          } catch {
            clearTimeout(timeoutId);
            dispatch({ type: "SET_AUTH_LOADING", loading: false });
          }
          return;
        }

        // Use fetch directly — completely bypasses Supabase client lock
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            }
          }
        );
        const rows = await response.json();
        clearTimeout(timeoutId);
        const data = rows?.[0];
        if (data) {
          dispatch({ type: "SET_AUTH", user: mapProfile(data as Record<string, unknown>) });
        } else {
          const user = await ensureProfile(authUser);
          if (user) dispatch({ type: "SET_AUTH", user });
          else dispatch({ type: "SET_AUTH_LOADING", loading: false });
        }
      } catch (e) {
        clearTimeout(timeoutId);
        console.error("[AppState] hydrateProfile CRASHED:", e);
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
      }
    }

    // Handle password reset callback — check both hash and query string.
    // Supabase implicit flow puts tokens in the hash; PKCE flow uses query params.
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const recoveryType =
      (hashParams.get("access_token") && hashParams.get("type") === "recovery") ||
      queryParams.get("type") === "recovery";
    if (recoveryType) {
      window.history.replaceState({}, "", window.location.pathname);
      clearTimeout(authTimeout);
      dispatch({ type: "SET_AUTH_LOADING", loading: false });
      window.location.replace("/reset-password");
      return;
    }

    // Handle implicit flow — access_token arrives in the URL hash
    const hashAccessToken = hashParams.get("access_token");
    const hashRefreshToken = hashParams.get("refresh_token");
    if (hashAccessToken && hashParams.get("type") !== "recovery") {
      window.history.replaceState({}, "", window.location.pathname);
      clearTimeout(authTimeout);
      (async () => {
        try {
          const { data, error } = await authSb.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken ?? "",
          });
          if (data?.user && !error) {
            await hydrateProfile(data.user.id, data.user);
          } else {
            dispatch({ type: "SET_AUTH_LOADING", loading: false });
          }
        } catch {
          dispatch({ type: "SET_AUTH_LOADING", loading: false });
        }
      })();
      return;
    }

    // Handle PKCE code that lands on the root URL (?code=xxx).
    // Supabase uses the configured Site URL when /auth/callback is not in the
    // allowed-redirect-URLs list, delivering the code here instead.
    // We do NOT return early — we still set up onAuthStateChange so PASSWORD_RECOVERY fires.
    const sessionUser = queryParams.get("session_user");
    if (sessionUser) {
      window.history.replaceState({}, "", window.location.pathname);
      clearTimeout(authTimeout);
      authSb.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          await hydrateProfile(session.user.id, session.user);
        } else {
          const { data: { user } } = await authSb.auth.getUser();
          if (user) await hydrateProfile(user.id, user);
          else dispatch({ type: "SET_AUTH_LOADING", loading: false });
        }
      }).catch(() => dispatch({ type: "SET_AUTH_LOADING", loading: false }));
      return;
    }

    const rootCode = queryParams.get("code");
    if (rootCode) {
      window.history.replaceState({}, "", window.location.pathname);
      clearTimeout(authTimeout);
      // Exchange async; onAuthStateChange below will fire PASSWORD_RECOVERY or SIGNED_IN
      authSb.auth.exchangeCodeForSession(rootCode).then(({ data: codeData, error: codeError }) => {
        if (codeError) {
          console.error("[AppState] PKCE exchange failed:", codeError.message);
          dispatch({ type: "SET_AUTH_LOADING", loading: false });
          return;
        }
        if (!codeData.session) {
          dispatch({ type: "SET_AUTH_LOADING", loading: false });
          return;
        }
        // recovery_sent_at is set by Supabase when a password reset email was sent.
        // Handle inline in case PASSWORD_RECOVERY event doesn't fire (e.g. some Supabase versions).
        const isRecovery = codeData.user?.recovery_sent_at != null;
        if (isRecovery) {
          dispatch({ type: "SET_AUTH_LOADING", loading: false });
          window.location.replace("/reset-password");
          return;
        }
        // If not recovery, SIGNED_IN event from onAuthStateChange will hydrate profile.
      });
    }

    // Track whether getSession already hydrated so INITIAL_SESSION doesn't double-fire
    let initializedByGetSession = false;

    // Subscribe to auth state changes — covers SIGNED_IN from PKCE exchange
    // (handled server-side by auth/callback/route.ts via @supabase/ssr),
    // INITIAL_SESSION on regular page loads, token refresh, and sign-out.
    const { data: { subscription } } = authSb.auth.onAuthStateChange(async (event, session) => {
      console.log("[AppState] onAuthStateChange", event, session?.user?.id ?? "no session");

      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        dispatch({ type: "CLEAR_AUTH" });
        return;
      }

      if (!session) return;

      if (event === "INITIAL_SESSION") {
        if (initializedByGetSession) {
          console.log("[AppState] INITIAL_SESSION skipped — already handled by getSession");
          return;
        }
        console.log("[AppState] INITIAL_SESSION — hydrating profile");
        clearTimeout(authTimeout);
        await hydrateProfile(session.user.id, session.user);
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        clearTimeout(authTimeout);
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
        window.location.replace("/reset-password");
        return;
      }

      if (event === "SIGNED_IN") {
        if (hydratingRef.current === session.user.id) {
          console.log("[AppState] SIGNED_IN skipped — already hydrating for", session.user.id);
          return;
        }
        hydratingRef.current = session.user.id;
        console.log("[AppState] SIGNED_IN — hydrating profile");
        clearTimeout(authTimeout);
        await hydrateProfile(session.user.id, session.user);
        // SET_AUTH reducer handles screen transition (role-setup or home)
        return;
      }

      // TOKEN_REFRESHED — session is still valid, no need to re-hydrate profile
    });

    // Check for an existing session on every page load.
    // After a Google OAuth redirect, auth/callback/route.ts has already exchanged
    // the code server-side and set the session cookie, so getSession() finds it here.
    // Skip when rootCode is present — exchangeCodeForSession + onAuthStateChange handle it.
    if (!rootCode) {
      authSb.auth.getSession().then(async ({ data: { session } }) => {
        clearTimeout(authTimeout);
        if (session?.user) {
          console.log("[AppState] getSession found session for", session.user.id);
          initializedByGetSession = true;
          await hydrateProfile(session.user.id, session.user);
          // SET_AUTH reducer handles screen transition (role-setup or home)
        } else {
          console.log("[AppState] getSession: no session, showing landing");
          dispatch({ type: "SET_AUTH_LOADING", loading: false });
        }
      }).catch((e) => {
        console.error("[AppState] getSession threw:", e);
        clearTimeout(authTimeout);
        dispatch({ type: "SET_AUTH_LOADING", loading: false });
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  function navigate(screen: Screen) {
    dispatch({ type: "NAVIGATE", screen });
  }

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, onlineUserIds }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}
