import { createBrowserClient } from "@supabase/ssr";
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

// ONE shared client instance for the entire app.
// Uses @supabase/ssr createBrowserClient which stores the PKCE code verifier
// in cookies instead of localStorage — cookies survive cross-origin redirects.
// On Orchids sandbox, routes through /api/proxy so Supabase is reachable.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url =
      typeof window !== "undefined" && isOrchidsSandbox()
        ? `${window.location.origin}/api/proxy`
        : REAL_URL;

    _client = createBrowserClient(url, ANON_KEY) as unknown as SupabaseClient;
  }
  return _client;
}

// All three exports return the same instance — kept for call-site compatibility.
export const getSupabase = getClient;
export const getAuthSupabase = getClient;
export const getRealtimeSupabase = getClient;

export function resetSupabaseClient() {
  _client = null;
}
