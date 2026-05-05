import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

let _client: SupabaseClient | null = null;
let _authClient: SupabaseClient | null = null;
let _realtimeClient: SupabaseClient | null = null;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Detect if we're running in the Orchids sandbox preview.
// The sandbox blocks direct XHR to Supabase, so DB/REST queries must be
// routed through the /api/proxy Next.js route instead.
function isOrchidsSandbox(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.includes("orchids.cloud")
  );
}

// DB/REST client.
// On Orchids sandbox: routes through /api/proxy to bypass network restrictions.
// On real domain (skillsnap.com.au, Vercel): uses the direct Supabase URL.
// createClient from @supabase/supabase-js correctly stores the session in
// localStorage and attaches the JWT as Bearer on every request — unlike
// createBrowserClient (@supabase/ssr) which is designed for cookie-based SSR.
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = isOrchidsSandbox()
      ? `${window.location.origin}/api/proxy`
      : REAL_URL;
    _client = createClient(url, ANON_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

// Auth client — ALWAYS uses the real Supabase URL directly.
// OAuth redirects, token refresh, and getUser() must bypass any proxy.
export function getAuthSupabase(): SupabaseClient {
  if (!_authClient) {
    _authClient = createClient(REAL_URL, ANON_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _authClient;
}

// Realtime client — always direct Supabase URL (WebSocket cannot be proxied).
export function getRealtimeSupabase(): SupabaseClient {
  if (!_realtimeClient) {
    _realtimeClient = createClient(REAL_URL, ANON_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _realtimeClient;
}

export function resetSupabaseClient() {
  _client = null;
  _authClient = null;
  _realtimeClient = null;
}
