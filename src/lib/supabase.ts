// cache-bust: 2026-07-19-v4
import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!instance) {
    instance = createBrowserClient(REAL_URL, ANON_KEY);
  }
  return instance;
}

export const getAuthSupabase = getSupabase;
export const getRealtimeSupabase = getSupabase;

export function resetSupabaseClient() {
  instance = null;
}