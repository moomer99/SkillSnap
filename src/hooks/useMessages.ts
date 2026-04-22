"use client";
// ─────────────────────────────────────────────
// useMessages — loads threads via messageService (Supabase).
// Falls back to MOCK_THREADS when Supabase is not configured.
// connectTo creates/finds a conversation (Connect flow).
// ─────────────────────────────────────────────
import { useEffect, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { MOCK_THREADS } from "@/mock-data/messages";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useMessages() {
  const { state, dispatch, navigate } = useAppState();

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      dispatch({ type: "SET_THREADS", threads: MOCK_THREADS });
      return;
    }
    messageService.getThreads().then((threads) => {
      dispatch({ type: "SET_THREADS", threads: threads.length ? threads : MOCK_THREADS });
    }).catch(() => {
      dispatch({ type: "SET_THREADS", threads: MOCK_THREADS });
    });
  }, [dispatch]);

  const openThread = useCallback(
    (threadId: string) => {
      dispatch({ type: "SET_ACTIVE_THREAD", threadId });
      messageService.markThreadRead(threadId).catch(() => {});
      navigate("chat");
    },
    [dispatch, navigate]
  );

  // Called when user taps Connect on a profile or feed card
  const connectTo = useCallback(
    async (participantId: string) => {
      if (!SUPABASE_CONFIGURED) {
        // Dev fallback: just navigate to chat with mock thread
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: "thread_1" });
        navigate("chat");
        return;
      }
      try {
        const conversationId = await messageService.getOrCreateConversation(participantId);
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: conversationId });
        navigate("chat");
      } catch {
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: "thread_1" });
        navigate("chat");
      }
    },
    [dispatch, navigate]
  );

  return {
    threads: state.threads,
    activeThreadId: state.activeThreadId,
    openThread,
    connectTo,
  };
}
