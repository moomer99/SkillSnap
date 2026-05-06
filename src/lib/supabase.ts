import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Dual-storage adapter: writes to both localStorage and sessionStorage so the
// PKCE code verifier survives Chrome's cross-origin redirect chain, where some
// browsers clear one storage type but not the other during OAuth redirects.
const customStorage = typeof window !== "undefined" ? {
  getItem: (key: string) => {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
} : undefined;

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
        lock: async (name, _acquireTimeout, fn) => {
          try {
            return await navigator.locks.request(name, { timeout: 3000 }, fn);
          } catch {
            // Lock timed out — run without it (safe for read operations)
            return await fn();
          }
        },
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
