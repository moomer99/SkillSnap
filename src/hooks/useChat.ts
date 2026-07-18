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
import type { Message } from "@/types";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useChat() {
  const { state, dispatch } = useAppState();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  const subscribedConvRef = useRef<string | null>(null);
  const isSubscribingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const threadId = state.activeThreadId ?? "";

  // Messages come from AppState cache — survive navigation.
  // Fall back to "mock_thread_local" bucket so optimistic messages sent before
  // a real threadId is assigned (e.g. guest/demo mode) still appear.
  const messagesKey = threadId || "mock_thread_local";
  const messages: Message[] = state.threadMessages[messagesKey] ?? [];

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      // Demo mode only — load mock messages
      const key = threadId || "mock_thread_local";
      const mock = MOCK_MESSAGES.filter((m) => m.threadId === key);
      dispatch({ type: "SET_THREAD_MESSAGES", threadId: key, messages: mock.length ? mock : MOCK_MESSAGES });
      setLoading(false);
      return;
    }

    if (!threadId) {
      setLoading(false);
      return;
    }

    // Only show loading spinner if no cached messages yet
    const hasCached = (state.threadMessages[threadId]?.length ?? 0) > 0;
    if (!hasCached) setLoading(true);

    function fetchMessages() {
      messageService.getMessages(threadId).then((msgs) => {
        if (msgs.length > 0) {
          // Sort ascending by time so messages always appear oldest-first below the Jobs Done card.
          const sorted = [...msgs].sort((a, b) => {
            const ta = a.time ?? "";
            const tb = b.time ?? "";
            return ta < tb ? -1 : ta > tb ? 1 : 0;
          });
          dispatch({ type: "MERGE_THREAD_MESSAGES", threadId, messages: sorted });
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }

    fetchMessages();

    // Tear down previous subscription only if the conversation changed.
    if (subscribedConvRef.current !== threadId) {
      unsubRef.current?.();
      unsubRef.current = null;
      subscribedConvRef.current = threadId;

      // Guard against double-subscription from React strict mode / re-renders
      if (!isSubscribingRef.current) {
        isSubscribingRef.current = true;
        // Subscribe to Realtime inserts — skip if message already in state (echo dedup)
        unsubRef.current = messageService.subscribeToMessages(threadId, (msg) => {
          dispatch({ type: "APPEND_THREAD_MESSAGE_IF_NEW", threadId, message: msg });
        });
        isSubscribingRef.current = false;
      }
    }

    // Refetch when tab becomes visible again — catches messages sent while
    // the Realtime subscription was suspended (background tab)
    function handleVisibility() {
      if (document.visibilityState === "visible") fetchMessages();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    // Polling fallback every 60s — Realtime handles live delivery; this is safety net only
    const pollInterval = setInterval(fetchMessages, 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(pollInterval);
      isSubscribingRef.current = false;
      // Do NOT unsubscribe or reset subscribedConvRef here —
      // subscription persists across re-renders for the same conversation
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

  const sendImageMessage = useCallback(async (file: File) => {
    const tid = threadId || "mock_thread_local";
    const optimisticId = `img_optimistic_${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);

    // Show preview immediately while uploading
    const optimistic: Message = {
      id: optimisticId,
      threadId: tid,
      from: "me",
      text: "",
      imageUrl: previewUrl,
      uploading: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    dispatch({ type: "APPEND_THREAD_MESSAGE", threadId: tid, message: optimistic });

    if (!SUPABASE_CONFIGURED || !threadId) return;

    try {
      const { getAuthSupabase } = await import("@/lib/supabase");
      const { data: { session } } = await getAuthSupabase().auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const imagePath = await messageService.uploadChatImage(file, userId);
      const confirmed = await messageService.sendMessage(tid, "", imagePath);
      URL.revokeObjectURL(previewUrl);
      dispatch({ type: "PATCH_THREAD_MESSAGE", threadId: tid, optimisticId, message: confirmed });
    } catch (err) {
      console.error("sendImageMessage failed:", err);
      URL.revokeObjectURL(previewUrl);
      const failed: Message = {
        id: optimisticId,
        threadId: tid,
        from: "me",
        text: "Image failed to send",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        failed: true,
      };
      dispatch({ type: "PATCH_THREAD_MESSAGE", threadId: tid, optimisticId, message: failed });
    }
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
