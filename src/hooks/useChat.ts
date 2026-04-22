"use client";
// ─────────────────────────────────────────────
// useChat — loads messages for the active thread,
// exposes sendMessage for the input bar
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import type { Message } from "@/types";

export function useChat() {
  const { state } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const threadId = state.activeThreadId ?? "thread_1";

  useEffect(() => {
    messageService.getMessages(threadId).then(setMessages);
  }, [threadId]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    setInputText("");
    const msg = await messageService.sendMessage(threadId, text);
    setMessages((prev) => [...prev, msg]);
    setSending(false);
  }, [inputText, threadId]);

  return {
    messages,
    inputText,
    setInputText,
    sending,
    sendMessage,
    threadId,
  };
}
