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
import { getAuthSupabase, getRealtimeSupabase } from "@/lib/supabase";
import { getPendingJobId } from "@/services/jobsDoneService";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useGlobalMessages() {
  const { state, dispatch } = useAppState();
  const threadIdsRef = useRef<string[]>([]);
  const subscribedRef = useRef(false);
  const notifChannelRef = useRef<ReturnType<ReturnType<typeof getAuthSupabase>["channel"]> | null>(null);

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

  // Realtime subscription for notifications (jobs_done_request, etc.).
  // Uses getRealtimeSupabase() — a dedicated client that always connects to the real
  // Supabase URL, bypassing the sandbox HTTP proxy which would break WebSockets.
  // JWT is injected via realtime.setAuth() so the user_id RLS filter is honoured.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !state.isAuthenticated || !state.currentUser) return;
    const userId = state.currentUser.id;

    const authSb = getAuthSupabase();
    const rtSb = getRealtimeSupabase();

    authSb.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        rtSb.realtime.setAuth(session.access_token);
      }

      console.log("[Notifications] subscribed for user:", userId);

      const channel = rtSb
        .channel(`user-notifications-${userId}`)
        .on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "postgres_changes" as any,
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          async (payload: { new: Record<string, unknown> }) => {
            console.log("[Notifications] received raw:", payload);
            const row = payload.new;

            // Filter in handler — avoids RLS issues with server-side filter
            if (row.user_id !== userId) return;

            dispatch({ type: "INCREMENT_UNREAD_NOTIF_COUNT" });

            if (row.type !== "jobs_done_request") return;
            const fromUserId = row.from_user_id as string;
            const fromName = (row.message as string) ?? "A pro";
            const notificationId = row.id as string;

            const jobId = await getPendingJobId(fromUserId);
            if (!jobId) return;

            dispatch({
              type: "SET_PENDING_JOBS_REQUEST",
              request: { jobId, fromName, notificationId },
            });
          }
        )
        .subscribe((status, err) => {
          console.log(`[Notifications] channel status: ${status}`, err ?? "");
        });

      notifChannelRef.current = channel;
    });

    return () => {
      if (notifChannelRef.current) {
        rtSb.removeChannel(notifChannelRef.current);
        notifChannelRef.current = null;
      }
    };
  // Re-subscribe when auth user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.currentUser?.id]);
}
