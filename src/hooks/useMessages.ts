"use client";
// ─────────────────────────────────────────────
// useMessages — loads threads via messageService,
// openThread dispatches SET_ACTIVE_THREAD and navigates.
// connectTo creates/finds a conversation and opens it (Connect flow).
// ─────────────────────────────────────────────
import { useEffect, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";

export function useMessages() {
  const { state, dispatch, navigate } = useAppState();

  useEffect(() => {
    messageService.getThreads().then((threads) => {
      dispatch({ type: "SET_THREADS", threads });
    });
  }, [dispatch]);

  const openThread = useCallback(
    (threadId: string) => {
      dispatch({ type: "SET_ACTIVE_THREAD", threadId });
      messageService.markThreadRead(threadId);
      navigate("chat");
    },
    [dispatch, navigate]
  );

  // Called when user taps Connect on a profile or feed card
  const connectTo = useCallback(
    async (participantId: string) => {
      const conversationId = await messageService.getOrCreateConversation(participantId);
      dispatch({ type: "SET_ACTIVE_THREAD", threadId: conversationId });
      navigate("chat");
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
