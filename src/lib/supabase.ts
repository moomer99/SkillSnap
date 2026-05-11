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

// Orchids sandbox can't reach Supabase directly — singleton proxy client is fine
// because this environment never uses PKCE cookie flow.
let _proxyClient: SupabaseClient | null = null;
function getProxyClient(): SupabaseClient {
  if (!_proxyClient) {
    const url = `${window.location.origin}/api/proxy`;
    _proxyClient = createClient(url, ANON_KEY);
  }
  return _proxyClient;
}

// createBrowserClient must NOT be cached — it must be called fresh each time
// so it reads the current cookie state for the PKCE verifier.
// Only called on production (skillsnap.com.au), never during SSR.
function getBrowserClient(): SupabaseClient {
  return createBrowserClient(REAL_URL, ANON_KEY) as unknown as SupabaseClient;
}

export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    // SSR fallback — no cookie access needed for server-side render paths
    return createClient(REAL_URL, ANON_KEY) as SupabaseClient;
  }
  if (isOrchidsSandbox()) return getProxyClient();
  return getBrowserClient();
}

export function getAuthSupabase(): SupabaseClient {
  return getSupabase();
}

export function getRealtimeSupabase(): SupabaseClient {
  return getSupabase();
}

export function resetSupabaseClient() {
  _proxyClient = null;
}
