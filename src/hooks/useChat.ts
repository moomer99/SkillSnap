"use client";
// ─────────────────────────────────────────────
// useChat — loads messages for the active thread via Supabase,
// subscribes to Realtime for live updates.
// Falls back to MOCK_MESSAGES in dev mode (no Supabase).
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from "react";
import { useAppState } from "@/state/AppState";
import { messageService } from "@/services/messageService";
import { MOCK_MESSAGES } from "@/mock-data/messages";
import type { Message } from "@/types";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useChat() {
  const { state } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const threadId = state.activeThreadId ?? "";

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
      // Dev mode: show mock messages for the active thread (or all if thread not in mock)
      const mock = MOCK_MESSAGES.filter((m) => m.threadId === threadId);
      setMessages(mock.length ? mock : MOCK_MESSAGES);
      setLoading(false);
      return;
    }

    setLoading(true);
    messageService.getMessages(threadId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    }).catch(() => {
      setMessages([]);
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
    if (!text) return;
    // Use active threadId or fall back to a local mock thread
    const tid = threadId || "mock_thread_local";
    setSending(true);
    setInputText("");

    // Optimistic append — always works, even in mock/no-thread mode
    const optimisticId = `optimistic_${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      threadId: tid,
      from: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimistic]);

    if (!SUPABASE_CONFIGURED || !threadId) {
      setSending(false);
      return;
    }

    try {
      const confirmed = await messageService.sendMessage(tid, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? confirmed : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, threadId]);

  // Send an image as a local-preview bubble (full upload wiring added when storage is ready)
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
    setMessages((prev) => [...prev, msg]);
  }, [threadId]);

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
