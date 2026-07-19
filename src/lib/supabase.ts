// Re-export the browser client for backward compatibility with existing code.
// New code should import directly from "@/lib/supabase/client" or "@/lib/supabase/server".
import { createClient, type SupabaseClient } from "./supabase/client";

export type { SupabaseClient };

export function getSupabase(): SupabaseClient {
  return createClient();
}

export const getAuthSupabase = getSupabase;
export const getRealtimeSupabase = getSupabase;

export function resetSupabaseClient(): void {
  // No-op: @supabase/ssr handles its own singleton caching internally.
  // Provided for backward compatibility only.
}