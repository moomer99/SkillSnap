import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

let _client: SupabaseClient | null = null;
let _authClient: SupabaseClient | null = null;
let _realtimeClient: SupabaseClient | null = null;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Detect if we're running in the Orchids sandbox preview
function isOrchidsSandbox(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.includes("orchids.cloud")
  );
}

// REST/Auth client
// - On Orchids sandbox: route through /supabase proxy (sandbox blocks direct Supabase requests)
// - On real domain (skillsnap.com.au, localhost): use direct Supabase URL
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = isOrchidsSandbox()
      ? `${window.location.origin}/supabase`
      : REAL_URL;
    _client = createBrowserClient(url, ANON_KEY);
  }
  return _client;
}

// Auth client — ALWAYS uses the real Supabase URL regardless of sandbox proxy.
// Session cookies are keyed to the real URL; using a proxied URL here causes
// a storage-key mismatch after OAuth callbacks and breaks session detection.
export function getAuthSupabase(): SupabaseClient {
  if (!_authClient) {
    _authClient = createBrowserClient(REAL_URL, ANON_KEY);
  }
  return _authClient;
}

// Realtime client — always uses direct Supabase URL (WebSocket can't be proxied)
export function getRealtimeSupabase(): SupabaseClient {
  if (!_realtimeClient) {
    _realtimeClient = createBrowserClient(REAL_URL, ANON_KEY);
  }
  return _realtimeClient;
}

export function resetSupabaseClient() {
  _client = null;
  _authClient = null;
  _realtimeClient = null;
}
