"use client";
import { useEffect } from "react";
import { getRealtimeSupabase } from "@/lib/supabase";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

// Module-level singleton — created once, never torn down.
// Avoids "cannot add postgres_changes callbacks after subscribe()" on remount.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _presenceChannel: any | null = null;

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !userId || _presenceChannel) return;
    const rt = getRealtimeSupabase();
    _presenceChannel = rt
      .channel("online-users")
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await _presenceChannel!.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });
    return () => {}; // never unsubscribe — singleton lives for the app session
  }, [userId]);
}
