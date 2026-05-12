import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Primary singleton ────────────────────────────────────────────────────────
// One instance for the entire app lifetime. Auth session, storage key, and
// token refresh are shared across every caller.
let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!instance) {
    instance = createClient(REAL_URL, ANON_KEY, {
      auth: {
        persistSession: true,
        storageKey: "sb-skillsnap-auth-token",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: (async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn()) as any,
      },
    });
  }
  return instance;
}

export const getAuthSupabase = getSupabase;

// ── Realtime singleton ───────────────────────────────────────────────────────
// Always uses the real Supabase URL — WebSocket connections must not go through
// the sandbox HTTP proxy (which doesn't support the Upgrade header).
let realtimeInstance: SupabaseClient | null = null;

export function getRealtimeSupabase(): SupabaseClient {
  if (!realtimeInstance) {
    realtimeInstance = createClient(REAL_URL, ANON_KEY, {
      auth: {
        persistSession: false,
        storageKey: "sb-skillsnap-auth-token",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "pkce",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: (async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn()) as any,
      },
    });
  }
  return realtimeInstance;
}

export function resetSupabaseClient() {
  instance = null;
}
