import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

let _client: SupabaseClient | null = null;
let _realtimeClient: SupabaseClient | null = null;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// REST/Auth client — routes through Next.js proxy so it works in sandboxed previews
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/supabase`
        : REAL_URL;
    const projectRef = REAL_URL.replace("https://", "").split(".")[0];
    _client = createBrowserClient(url, ANON_KEY, {
      storageKey: `sb-${projectRef}-auth-token`,
    });
  }
  return _client;
}

// Realtime client — must use the direct Supabase URL because WebSocket upgrades
// can't be proxied through Next.js rewrites.
export function getRealtimeSupabase(): SupabaseClient {
  if (!_realtimeClient) {
    const projectRef = REAL_URL.replace("https://", "").split(".")[0];
    _realtimeClient = createBrowserClient(REAL_URL, ANON_KEY, {
      storageKey: `sb-${projectRef}-auth-token`,
    });
  }
  return _realtimeClient;
}

export function resetSupabaseClient() {
  _client = null;
  _realtimeClient = null;
}
