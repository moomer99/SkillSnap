"use client";
import { useEffect, useRef, useState } from "react";
import { getRealtimeSupabase } from "@/lib/supabase";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

const IDLE_MS = 5 * 60 * 1000; // 5 minutes

// Module-level singleton — presence channel must only be created once per session.
// Re-creating it on every mount causes "cannot add postgres_changes callbacks after subscribe()" errors.
type PresenceChannel = ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]>;
let presenceChannel: PresenceChannel | null = null;
let presenceUserId: string | null = null;

export function usePresence(userId: string | null) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<PresenceChannel | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !userId) return;

    // Channel already exists — skip entirely, one per app session
    if (presenceChannel) {
      channelRef.current = presenceChannel;
      return;
    }

    const rt = getRealtimeSupabase();
    const channel = rt.channel("online-users", {
      config: { presence: { key: userId } },
    });
    presenceChannel = channel;
    presenceUserId = userId;
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set(
          Object.values(state)
            .flat()
            .map((p) => (p as { user_id: string }).user_id)
            .filter(Boolean)
        );
        setOnlineUserIds(ids);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (newPresences as any[]).forEach((p) => { if (p.user_id) next.add(p.user_id as string); });
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (leftPresences as any[]).forEach((p) => next.delete(p.user_id as string));
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    // Idle detection — untrack after 5 min of no activity, re-track on activity
    function resetIdle() {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      // Re-track in case we went idle
      channel.track({ user_id: userId, online_at: new Date().toISOString() }).catch(() => {});
      idleTimerRef.current = setTimeout(() => {
        channel.untrack().catch(() => {});
      }, IDLE_MS);
    }

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle(); // start the idle timer immediately

    // Untrack when tab goes to background, re-track when it comes back
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        channel.untrack().catch(() => {});
      } else {
        channel.track({ user_id: userId, online_at: new Date().toISOString() }).catch(() => {});
        resetIdle();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      // Only remove event listeners — keep the channel alive (singleton).
      // It will be torn down on sign-out when userId changes.
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [userId]);

  return onlineUserIds;
}
