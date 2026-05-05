"use client";
// ─────────────────────────────────────────────
// useGlobalMessages — persistent background subscription.
// Must be mounted once at the app shell level (never unmounts).
// Keeps the message cache and unread counts fresh for ALL threads
// even when MessagesScreen or ChatScreen are not mounted.
// ─────────────────────────────────────────────
import { useEffect, useRef, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { showMessageNotification } from "@/hooks/useNotifications";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useGlobalMessages() {
  const { state, dispatch } = useAppState();
  const threadIdsRef = useRef<string[]>([]);
  const loadedRef = useRef(false);

  // Keep threadIdsRef in sync with AppState threads
  useEffect(() => {
    threadIdsRef.current = state.threads.map((t) => t.id);
  }, [state.threads]);

  const loadThreads = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const threads = await messageService.getThreads();
      dispatch({ type: "SET_THREADS", threads });
      threadIdsRef.current = threads.map((t) => t.id);
    } catch {
      // Non-fatal — threads stay as-is
    }
  }, [dispatch]);

  // Initial load once the user is authenticated
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    if (!state.isAuthenticated || loadedRef.current) return;
    loadedRef.current = true;
    loadThreads();
  }, [state.isAuthenticated, loadThreads]);

  // Persistent global subscriptions — set up once after auth, never torn down
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !state.isAuthenticated) return;

    const unsubConv = messageService.subscribeToConversationUpdates(
      threadIdsRef,
      () => { loadThreads(); }
    );

    const unsubMsgs = messageService.subscribeToAllMessages(
      threadIdsRef,
      (msg) => {
        // Unknown conversation → reload threads so it appears in inbox
        if (!threadIdsRef.current.includes(msg.threadId)) {
          loadThreads();
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
      unsubConv();
      unsubMsgs();
    };
  // Only subscribe once per auth state — stable after login
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);
}
