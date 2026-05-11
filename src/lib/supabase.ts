import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function isOrchidsSandbox(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.includes("orchids.cloud")
  );
}

// Single singleton client for the entire app lifetime.
// Uses standard createClient (localStorage-based) — no Web Lock API,
// no cookie conflicts. The server-side callback route handles PKCE exchange.
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url =
      typeof window !== "undefined" && isOrchidsSandbox()
        ? `${window.location.origin}/api/proxy`
        : REAL_URL;
    _client = createClient(url, ANON_KEY, {
      auth: {
        persistSession: true,
        storageKey: "sb-skillsnap-auth-token",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return _client;
}

export function getAuthSupabase(): SupabaseClient {
  return getSupabase();
}

export function getRealtimeSupabase(): SupabaseClient {
  return getSupabase();
}

export function resetSupabaseClient() {
  _client = null;
}
