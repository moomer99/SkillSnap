import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// In-memory fallback for browsers where localStorage/sessionStorage is blocked
const memoryStore: Record<string, string> = {};
const memoryStorage = {
  getItem: (key: string) => memoryStore[key] ?? null,
  setItem: (key: string, value: string) => { memoryStore[key] = value; },
  removeItem: (key: string) => { delete memoryStore[key]; },
};

function safeLocalStorage() {
  try {
    localStorage.setItem("__test__", "1");
    localStorage.removeItem("__test__");
    return true;
  } catch { return false; }
}

function safeSessionStorage() {
  try {
    sessionStorage.setItem("__test__", "1");
    sessionStorage.removeItem("__test__");
    return true;
  } catch { return false; }
}

// Dual-storage adapter: writes to both localStorage and sessionStorage so the
// PKCE code verifier survives Chrome's cross-origin redirect chain. Falls back
// to in-memory storage if either API is blocked (private browsing, iframe, etc).
const customStorage = typeof window !== "undefined" ? (() => {
  const hasLocal = safeLocalStorage();
  const hasSession = safeSessionStorage();
  if (!hasLocal && !hasSession) return memoryStorage;
  return {
    getItem: (key: string) => {
      if (hasLocal) return localStorage.getItem(key) ?? (hasSession ? sessionStorage.getItem(key) : null);
      return hasSession ? sessionStorage.getItem(key) : null;
    },
    setItem: (key: string, value: string) => {
      if (hasLocal) localStorage.setItem(key, value);
      if (hasSession) sessionStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
      if (hasLocal) localStorage.removeItem(key);
      if (hasSession) sessionStorage.removeItem(key);
    },
  };
})() : undefined;

// ONE shared client instance for the entire app.
// Multiple createClient instances sharing the same localStorage key fight over
// the auth token lock (5000ms timeout → stale JWT → RLS blocks all queries).
// A single instance has one token refresher, one lock, no contention.
let _client: SupabaseClient | null = null;

function isOrchidsSandbox(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.includes("orchids.cloud")
  );
}

function getClient(): SupabaseClient {
  if (!_client) {
    // On Orchids sandbox the browser can't reach Supabase directly — route
    // everything through the /api/proxy Next.js handler which forwards to
    // the real Supabase URL. Auth, DB, and Storage all work through the proxy.
    // On production (Vercel/skillsnap.com.au) use the real URL directly.
    const url =
      typeof window !== "undefined" && isOrchidsSandbox()
        ? `${window.location.origin}/api/proxy`
        : REAL_URL;

    _client = createClient(url, ANON_KEY, {
      auth: {
        storage: customStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        fetch: (...args) => fetch(...args),
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    });
  }
  return _client;
}

// All three exports return the same instance — kept for backwards compatibility
// with all call sites that import getSupabase / getAuthSupabase / getRealtimeSupabase.
export const getSupabase = getClient;
export const getAuthSupabase = getClient;
export const getRealtimeSupabase = getClient;

export function resetSupabaseClient() {
  _client = null;
}
