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

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      dispatch({ type: "SET_THREADS", threads: MOCK_THREADS });
      return;
    }
    messageService.getThreads().then((threads) => {
      // Show real threads (even if empty) — don't inject mock data into real accounts
      dispatch({ type: "SET_THREADS", threads });
    }).catch(() => {
      dispatch({ type: "SET_THREADS", threads: [] });
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
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: conversationId, participantId });
        navigate("chat");
      } catch {
        // Auth/network failure — navigate anyway so UX isn't dead
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: "thread_1", participantId });
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
  };
}
