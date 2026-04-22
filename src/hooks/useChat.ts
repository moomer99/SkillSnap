"use client";
// ─────────────────────────────────────────────
// useChat — loads messages for the active thread via Supabase,
// subscribes to Realtime for live updates.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import type { Message } from "@/types";

export function useChat() {
  const { state } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  const threadId = state.activeThreadId ?? "";

  useEffect(() => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    messageService.getMessages(threadId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    // Subscribe to Realtime inserts
    unsubRef.current = messageService.subscribeToMessages(threadId, (msg) => {
      setMessages((prev) => {
        // Avoid duplicate if we already optimistically appended
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [threadId]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !threadId) return;
    setSending(true);
    setInputText("");

    // Optimistic append
    const optimistic: Message = {
      id: `optimistic_${Date.now()}`,
      threadId,
      from: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimistic]);

    const confirmed = await messageService.sendMessage(threadId, text);
    // Replace optimistic with confirmed
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? confirmed : m))
    );
    setSending(false);
  }, [inputText, threadId]);

  return {
    messages,
    inputText,
    setInputText,
    sending,
    loading,
    sendMessage,
    threadId,
  };
}
