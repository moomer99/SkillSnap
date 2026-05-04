import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

let _client: SupabaseClient | null = null;
let _authClient: SupabaseClient | null = null;
let _realtimeClient: SupabaseClient | null = null;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Derive the canonical storage key from the real project ref.
// BOTH the proxy client and the direct auth client MUST use this same key
// so the session written by one is always readable by the other.
// Without this, getUser() on the proxy client returns null → RLS blocks
// every authenticated DB/storage operation.
const AUTH_STORAGE_KEY = REAL_URL
  ? `sb-${new URL(REAL_URL).hostname.split(".")[0]}-auth-token`
  : "sb-auth-token";

// Detect if we're running in the Orchids sandbox preview
function isOrchidsSandbox(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.includes("orchids.cloud")
  );
}

// REST/DB client
// - On Orchids sandbox: route through /supabase proxy (sandbox blocks direct XHR to Supabase)
// - On real domain (skillsnap.com.au, localhost): use direct Supabase URL
// Uses the same AUTH_STORAGE_KEY as the auth client so RLS policies see the
// correct user identity when the proxy client makes authenticated requests.
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = isOrchidsSandbox()
      ? `${window.location.origin}/supabase`
      : REAL_URL;
    _client = createBrowserClient(url, ANON_KEY, {
      auth: { storageKey: AUTH_STORAGE_KEY },
    });
  }
  return _client;
}

// Auth client — ALWAYS uses the real Supabase URL.
// Session lifecycle (OAuth, token refresh) must go directly to Supabase.
// All auth.getUser() / getSession() calls in services should use this client.
export function getAuthSupabase(): SupabaseClient {
  if (!_authClient) {
    _authClient = createBrowserClient(REAL_URL, ANON_KEY, {
      auth: { storageKey: AUTH_STORAGE_KEY },
    });
  }
  return _authClient;
}

// Realtime client — always uses direct Supabase URL (WebSocket can't be proxied)
export function getRealtimeSupabase(): SupabaseClient {
  if (!_realtimeClient) {
    _realtimeClient = createBrowserClient(REAL_URL, ANON_KEY, {
      auth: { storageKey: AUTH_STORAGE_KEY },
    });
  }
  return _realtimeClient;
}

export function resetSupabaseClient() {
  _client = null;
  _authClient = null;
  _realtimeClient = null;
}
