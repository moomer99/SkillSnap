"use client";
// ─────────────────────────────────────────────
// useMessages — loads message threads via messageService,
// exposes openThread for navigating into a chat
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

  return {
    threads: state.threads,
    activeThreadId: state.activeThreadId,
    openThread,
  };
}
