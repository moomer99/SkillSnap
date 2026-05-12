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

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useGlobalMessages() {
  const { state, dispatch } = useAppState();
  const threadIdsRef = useRef<string[]>([]);
  const subscribedRef = useRef(false);

  // Keep threadIdsRef in sync whenever AppState threads change
  useEffect(() => {
    threadIdsRef.current = state.threads.map((t) => t.id);
  }, [state.threads]);

  const loadThreads = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const threads = await messageService.getThreads();
      dispatch({ type: "SET_THREADS", threads });
      dispatch({ type: "CLEAR_ALL_THREAD_UNREAD" });
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

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubConv = messageService.subscribeToConversationUpdates(
      threadIdsRef,
      () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { loadThreads(); }, 2000);
      }
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

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      subscribedRef.current = false;
      unsubConv();
      unsubMsgs();
    };
  // Re-subscribe only when auth changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

}
