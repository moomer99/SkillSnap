// cache-bust: 2026-07-19-v5
import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient<any>>;

const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!instance) {
    instance = createBrowserClient(REAL_URL, ANON_KEY, {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          const parsed: { name: string; value: string }[] = [];
          document.cookie.split("; ").forEach((c) => {
            const eq = c.indexOf("=");
            if (eq === -1) {
              if (c.trim()) parsed.push({ name: c.trim(), value: "" });
            } else {
              parsed.push({
                name: c.slice(0, eq).trim(),
                value: decodeURIComponent(c.slice(eq + 1)),
              });
            }
          });
          return parsed;
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${encodeURIComponent(value ?? "")}`;
            if (options?.path) cookie += `; path=${options.path}`;
            if (options?.maxAge !== undefined) cookie += `; max-age=${options.maxAge}`;
            if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
            if (options?.secure || (typeof location !== "undefined" && location.protocol === "https:"))
              cookie += `; secure`;
            document.cookie = cookie;
          });
        },
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