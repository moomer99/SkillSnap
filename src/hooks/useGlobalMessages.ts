"use client";
// ─────────────────────────────────────────────
// useGlobalMessages — persistent background subscription.
// Mounted once at the app shell level — never unmounts.
// Keeps message cache and unread counts fresh for ALL threads
// even when MessagesScreen or ChatScreen are not rendered.
// ─────────────────────────────────────────────
import { useEffect, useRef, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { showMessageNotification } from "@/hooks/useNotifications";
import { getAuthSupabase } from "@/lib/supabase";
import { getPendingJobId } from "@/services/jobsDoneService";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useGlobalMessages() {
  const { state, dispatch } = useAppState();
  const threadIdsRef = useRef<string[]>([]);
  const subscribedRef = useRef(false);
  const notifPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());

  // Keep threadIdsRef in sync whenever AppState threads change
  useEffect(() => {
    threadIdsRef.current = state.threads.map((t) => t.id);
  }, [state.threads]);

  const loadThreads = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const threads = await messageService.getThreads();
      dispatch({ type: "SET_THREADS", threads });
      threadIdsRef.current = threads.map((t) => t.id);
    } catch (err) {
      console.error("[useGlobalMessages] loadThreads error:", err);
    }
  // dispatch is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load threads + unread notification count on auth
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !state.isAuthenticated || !state.currentUser) return;
    loadThreads();
    // Fetch initial unread notification count
    const sb = getAuthSupabase();
    sb.from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", state.currentUser.id)
      .eq("read", false)
      .then(({ count }) => {
        dispatch({ type: "SET_UNREAD_NOTIF_COUNT", count: count ?? 0 });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.currentUser?.id]);

  // Persistent Realtime subscriptions — set up once per session, never torn down.
  // Re-run only when authentication status changes so subscriptions survive
  // navigation between screens.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !state.isAuthenticated) return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsubConv = messageService.subscribeToConversationUpdates(
      threadIdsRef,
      () => { loadThreads(); }
    );

    const unsubMsgs = messageService.subscribeToAllMessages(
      threadIdsRef,
      (msg) => {
        // New conversation the receiver doesn't know about yet → auto-join then reload
        if (!threadIdsRef.current.includes(msg.threadId)) {
          messageService.joinConversation(msg.threadId).then((joined) => {
            if (joined) loadThreads();
          });
          return;
        }
        dispatch({ type: "APPEND_THREAD_MESSAGE_IF_NEW", threadId: msg.threadId, message: msg });
        if (msg.from === "them") {
          dispatch({ type: "INCREMENT_THREAD_UNREAD", threadId: msg.threadId });
          showMessageNotification({
            senderName: msg.senderName ?? "New message",
            senderInitial: (msg.senderName ?? "?")[0].toUpperCase(),
            text: msg.text ?? "Sent you a message",
          });
        }
      }
    );

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        unsubConv?.();
        unsubMsgs?.();
        subscribedRef.current = false;
      } else if (document.visibilityState === "visible") {
        subscribedRef.current = false; // force re-subscribe
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      subscribedRef.current = false;
      unsubConv();
      unsubMsgs();
    };
  // Re-subscribe only when auth changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  // Poll for unread notifications every 15 seconds.
  // Replaces Realtime subscription which failed to fire due to RLS/proxy issues.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !state.isAuthenticated || !state.currentUser) return;
    const userId = state.currentUser.id;
    const sb = getAuthSupabase();

    async function pollNotifications() {
      const { data, error } = await sb
        .from("notifications")
        .select("id, type, from_user_id, message, read")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false });

      if (error) { console.error("[Notifications] poll error:", error.message); return; }
      if (!data?.length) return;

      // Update badge to exact unread count
      dispatch({ type: "SET_UNREAD_NOTIF_COUNT", count: data.length });

      // Process only notifications we haven't handled yet this session
      for (const row of data) {
        if (seenNotifIdsRef.current.has(row.id)) continue;
        seenNotifIdsRef.current.add(row.id);

        console.log("[Notifications] received:", row);

        if (row.type !== "jobs_done_request") continue;

        const jobId = await getPendingJobId(row.from_user_id);
        if (!jobId) continue;

        dispatch({
          type: "SET_PENDING_JOBS_REQUEST",
          request: { jobId, fromName: row.message ?? "A pro", notificationId: row.id },
        });
      }
    }

    // Run immediately on login, then every 15 seconds
    pollNotifications();
    notifPollRef.current = setInterval(pollNotifications, 15_000);

    return () => {
      if (notifPollRef.current) {
        clearInterval(notifPollRef.current);
        notifPollRef.current = null;
      }
      seenNotifIdsRef.current.clear();
    };
  // Restart polling when auth user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.currentUser?.id]);
}
