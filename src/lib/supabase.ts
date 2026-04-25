import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    // In the browser, route through Next.js rewrite (/supabase → Supabase)
    // so requests stay same-origin and work in sandboxed preview environments.
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/supabase`
        : process.env.NEXT_PUBLIC_SUPABASE_URL!;

    _client = createBrowserClient(
      url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}
