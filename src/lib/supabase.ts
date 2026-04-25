// SkillSnap — Supabase Client
// Requests are proxied through /api/proxy to avoid browser network restrictions
// in sandboxed preview environments (Orchids, etc.)
import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

let _client: SupabaseClient | null = null;

function getProxyUrl(): string {
  if (typeof window !== "undefined") {
    // In the browser, route through our Next.js proxy
    return `${window.location.origin}/api/proxy`;
  }
  // On the server, hit Supabase directly
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      getProxyUrl(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

// Reset client (needed when proxy URL changes, e.g. on navigation)
export function resetSupabaseClient() {
  _client = null;
}
