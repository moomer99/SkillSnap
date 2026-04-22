"use client";
// ─────────────────────────────────────────────
// useMessages — loads threads via messageService (Supabase).
// Falls back to MOCK_THREADS when Supabase is not configured.
// connectTo creates/finds a conversation (Connect flow).
// ─────────────────────────────────────────────
import { useEffect, useCallback, useState } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { MOCK_THREADS } from "@/mock-data/messages";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useMessages() {
  const { state, dispatch, navigate } = useAppState();
  const [connecting, setConnecting] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      dispatch({ type: "SET_THREADS", threads: MOCK_THREADS });
      return;
    }
    try {
      const threads = await messageService.getThreads();
      dispatch({ type: "SET_THREADS", threads });
    } catch {
      dispatch({ type: "SET_THREADS", threads: [] });
    }
  }, [dispatch]);

  // Initial load
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Subscribe to conversation updates so the thread list stays fresh after messages are sent
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    if (!state.threads.length) return;

    const ids = state.threads.map((t) => t.id);
    const unsub = messageService.subscribeToConversationUpdates(ids, () => {
      loadThreads();
    });

    return unsub;
  }, [state.threads.length, loadThreads]);

  const openThread = useCallback(
    (threadId: string) => {
      // Resolve the participant from the already-loaded threads list
      const thread = state.threads.find((t) => t.id === threadId);
      const participantId = thread?.participant?.id;
      dispatch({ type: "SET_ACTIVE_THREAD", threadId, participantId });
      messageService.markThreadRead(threadId).catch(() => {});
      navigate("chat");
    },
    [dispatch, navigate, state.threads]
  );

  // Called when user taps Connect — finds or creates a conversation, then navigates to chat
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
        // Refresh threads list so the new conversation appears in messages
        const threads = await messageService.getThreads();
        dispatch({ type: "SET_THREADS", threads });
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: conversationId, participantId });
        navigate("chat");
      } catch {
        // Auth/network failure — navigate anyway so UX isn't dead
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
    activeThreadId: state.activeThreadId,
    openThread,
    connectTo,
    connecting,
    reloadThreads: loadThreads,
  };
}
