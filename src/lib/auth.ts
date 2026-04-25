// Shared auth helper — uses getUser() (live API call) instead of getSession()
// so it works correctly when the Supabase client is routed through a proxy.
import { getSupabase } from "./supabase";

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await getSupabase().auth.getUser();
  return user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error("Not authenticated");
  return id;
}
