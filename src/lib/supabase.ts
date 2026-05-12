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

// Primary client — may use proxy URL on Orchids sandbox for HTTP requests.
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
        detectSessionInUrl: false,
        flowType: "pkce",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: (async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn()) as any,
      },
    });
  }
  return _client;
}

export function getAuthSupabase(): SupabaseClient {
  return getSupabase();
}

// Realtime client — always uses the real Supabase URL so WebSocket connections
// are not routed through the sandbox proxy (which breaks Realtime entirely).
let _realtimeClient: SupabaseClient | null = null;

export function getRealtimeSupabase(): SupabaseClient {
  if (!_realtimeClient) {
    _realtimeClient = createClient(REAL_URL, ANON_KEY, {
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
  return _realtimeClient;
}

export function resetSupabaseClient() {
  _client = null;
}
