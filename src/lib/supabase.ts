// cache-bust: 2026-07-19-v3
import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-based storage for PKCE code verifier — required by the server-side
// /auth/callback route which reads the code verifier from request cookies.
const cookieStorage = {
  getItem(key: string) {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem(key: string, value: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=34560000; samesite=lax; secure`;
  },
  removeItem(key: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; path=/; max-age=0; samesite=lax; secure`;
  },
};

let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!instance) {
    instance = createBrowserClient(REAL_URL, ANON_KEY, {
      cookies: {
        get(name: string) {
          if (typeof document === "undefined") return "";
          const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
          return match ? decodeURIComponent(match[1]) : "";
        },
        set(name: string, value: string) {
          if (typeof document === "undefined") return;
          document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=34560000; samesite=lax; secure`;
        },
        remove(name: string) {
          if (typeof document === "undefined") return;
          document.cookie = `${name}=; path=/; max-age=0; samesite=lax; secure`;
        },
      },
      auth: {
        persistSession: true,
        storageKey: "sb-skillsnap-auth-token",
        storage: cookieStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return instance;
}

export const getAuthSupabase = getSupabase;
export const getRealtimeSupabase = getSupabase;

export function resetSupabaseClient() {
  instance = null;
}
