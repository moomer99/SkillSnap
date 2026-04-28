"use client";
// ─────────────────────────────────────────────
// useChat — loads messages for the active thread via Supabase,
// subscribes to Realtime for live updates.
// Messages are cached in AppState so they survive navigation.
// Falls back to MOCK_MESSAGES in dev mode (no Supabase).
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { MOCK_MESSAGES } from "@/mock-data/messages";
import { showMessageNotification } from "@/hooks/useNotifications";
import type { Message } from "@/types";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useChat() {
  const { state, dispatch } = useAppState();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const threadId = state.activeThreadId ?? "";

  // Messages come from AppState cache — survive navigation
  const messages: Message[] = threadId ? (state.threadMessages[threadId] ?? []) : [];

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    if (!SUPABASE_CONFIGURED) {
      const mock = MOCK_MESSAGES.filter((m) => m.threadId === threadId);
      const mockMsgs = mock.length ? mock : MOCK_MESSAGES;
      dispatch({ type: "SET_THREAD_MESSAGES", threadId, messages: mockMsgs });
      setLoading(false);
      return;
    }

    // Only show loading spinner if no cached messages yet
    const hasCached = (state.threadMessages[threadId]?.length ?? 0) > 0;
    if (!hasCached) setLoading(true);

    messageService.getMessages(threadId).then((msgs) => {
      if (msgs.length > 0) {
        dispatch({ type: "SET_THREAD_MESSAGES", threadId, messages: msgs });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Tear down any previous subscription before creating a new one
    unsubRef.current?.();
    unsubRef.current = null;

    // Subscribe to Realtime inserts
    unsubRef.current = messageService.subscribeToMessages(threadId, (msg) => {
      dispatch({ type: "APPEND_THREAD_MESSAGE", threadId, message: msg });
      if (msg.from === "them") {
        showMessageNotification({
          senderName: msg.senderName ?? "New message",
          senderInitial: (msg.senderName ?? "?")[0].toUpperCase(),
          text: msg.text ?? "Sent you a message",
        });
      }
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    const tid = threadId || "mock_thread_local";
    setSending(true);
    setInputText("");

    const optimisticId = `optimistic_${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      threadId: tid,
      from: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    dispatch({ type: "APPEND_THREAD_MESSAGE", threadId: tid, message: optimistic });

    if (!SUPABASE_CONFIGURED || !threadId) {
      setSending(false);
      return;
    }

    try {
      const confirmed = await messageService.sendMessage(tid, text);
      dispatch({ type: "PATCH_THREAD_MESSAGE", threadId: tid, optimisticId, message: confirmed });
    } catch (err) {
      console.error("sendMessage failed:", err);
      const failed: Message = { ...optimistic, failed: true };
      dispatch({ type: "PATCH_THREAD_MESSAGE", threadId: tid, optimisticId, message: failed });
    } finally {
      setSending(false);
    }
  }, [inputText, threadId, dispatch]);

  const sendImageMessage = useCallback((imageUrl: string, fileName: string) => {
    if (!threadId) return;
    const msg: Message = {
      id: `img_${Date.now()}`,
      threadId,
      from: "me",
      text: fileName,
      imageUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    dispatch({ type: "APPEND_THREAD_MESSAGE", threadId, message: msg });
  }, [threadId, dispatch]);

  return {
    messages,
    inputText,
    setInputText,
    sending,
    loading,
    sendMessage,
    sendImageMessage,
    threadId,
    bottomRef,
  };
}
