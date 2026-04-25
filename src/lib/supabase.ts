import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

let _client: SupabaseClient | null = null;

// In the browser, route through Next.js rewrite (/supabase → Supabase origin)
// so requests stay same-origin and bypass sandbox network restrictions.
// On the server, hit Supabase directly.
const SUPABASE_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/supabase`
    : process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}
