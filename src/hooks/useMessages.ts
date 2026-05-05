"use client";
// ─────────────────────────────────────────────
// useMessages — loads threads via messageService (Supabase).
// Falls back to MOCK_THREADS when Supabase is not configured.
// connectTo creates/finds a conversation (Connect flow).
// Background subscriptions are handled by useGlobalMessages in the app shell.
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
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      dispatch({ type: "SET_THREADS", threads: MOCK_THREADS });
      setThreadsLoading(false);
      return;
    }
    try {
      const threads = await messageService.getThreads();
      dispatch({ type: "SET_THREADS", threads });
    } catch (err) {
      console.error("[useMessages] loadThreads error:", err);
      dispatch({ type: "SET_THREADS", threads: [] });
    } finally {
      setThreadsLoading(false);
    }
  // dispatch is stable — this callback never changes after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh thread list whenever MessagesScreen mounts
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

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
      setConnectingId(participantId);
      if (!SUPABASE_CONFIGURED) {
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: "thread_1", participantId });
        navigate("chat");
        setConnectingId(null);
        return;
      }
      // Navigate immediately with a placeholder thread — feels instant to the user.
      // The real conversation ID resolves in the background and updates the state.
      dispatch({ type: "SET_ACTIVE_THREAD", threadId: "", participantId });
      navigate("chat");
      try {
        const conversationId = await messageService.getOrCreateConversation(participantId);
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: conversationId, participantId });
        // Refresh threads in background so Messages screen stays up to date
        messageService.getThreads().then((threads) => {
          dispatch({ type: "SET_THREADS", threads });
        }).catch(() => {});
      } catch (err) {
        console.error("[useMessages] connectTo error:", err);
      } finally {
        setConnectingId(null);
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
    connecting: connectingId,
    reloadThreads: loadThreads,
  };
}
