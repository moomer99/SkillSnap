"use client";
// ─────────────────────────────────────────────
// useMessages — loads threads via messageService (Supabase).
// Falls back to MOCK_THREADS when Supabase is not configured.
// connectTo creates/finds a conversation (Connect flow).
// ─────────────────────────────────────────────
import { useEffect, useCallback, useState, useRef } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { MOCK_THREADS } from "@/mock-data/messages";
import { showMessageNotification } from "@/hooks/useNotifications";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useMessages() {
  const { state, dispatch, navigate } = useAppState();
  const [connecting, setConnecting] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  // Track thread IDs for the Realtime subscription without causing re-subscription loops
  const threadIdsRef = useRef<string[]>([]);

  const loadThreads = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      dispatch({ type: "SET_THREADS", threads: MOCK_THREADS });
      setThreadsLoading(false);
      return;
    }
    try {
      const threads = await messageService.getThreads();
      dispatch({ type: "SET_THREADS", threads });
      threadIdsRef.current = threads.map((t) => t.id);
    } catch {
      dispatch({ type: "SET_THREADS", threads: [] });
    } finally {
      setThreadsLoading(false);
    }
  // dispatch is stable — this callback never changes after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load threads once on mount
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Subscribe to conversation updates so the thread list stays fresh after messages are sent.
  // Uses a ref for thread IDs so the subscription isn't torn down and re-created on every load.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    const unsubConv = messageService.subscribeToConversationUpdates(
      threadIdsRef,
      () => { loadThreads(); }
    );

    // Fix 2 & 4: subscribe to new message INSERTs across ALL user conversations.
    // This ensures recipients receive messages and triggers background notifications
    // even when the chat screen is closed.
    const unsubMsgs = messageService.subscribeToAllMessages(
      threadIdsRef,
      (msg) => {
        // Dispatch into the correct thread cache (dedup-safe)
        dispatch({ type: "APPEND_THREAD_MESSAGE_IF_NEW", threadId: msg.threadId, message: msg });
        // Increment local unread badge for incoming messages
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
  // Only subscribe once — loadThreads and dispatch are stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openThread = useCallback(
    (threadId: string) => {
      const thread = state.threads.find((t) => t.id === threadId);
      const participantId = thread?.participant?.id;
      dispatch({ type: "SET_ACTIVE_THREAD", threadId, participantId });
      messageService.markThreadRead(threadId).catch(() => {});
      navigate("chat");
    },
    [dispatch, navigate, state.threads]
  );

  const connectTo = useCallback(
    async (participantId: string) => {
      setConnecting(true);
      if (!SUPABASE_CONFIGURED) {
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: "thread_1", participantId });
        navigate("chat");
        setConnecting(false);
        return;
      }
      try {
        const conversationId = await messageService.getOrCreateConversation(participantId);
        // Refresh threads so the new conversation appears in the list
        const threads = await messageService.getThreads();
        dispatch({ type: "SET_THREADS", threads });
        threadIdsRef.current = threads.map((t) => t.id);
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: conversationId, participantId });
        navigate("chat");
      } catch {
        // Auth/network failure — navigate to chat anyway; user sees empty thread
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: "", participantId });
        navigate("chat");
      } finally {
        setConnecting(false);
      }
    },
    [dispatch, navigate]
  );

  return {
    threads: state.threads,
    threadsLoading,
    activeThreadId: state.activeThreadId,
    openThread,
    connectTo,
    connecting,
    reloadThreads: loadThreads,
  };
}
