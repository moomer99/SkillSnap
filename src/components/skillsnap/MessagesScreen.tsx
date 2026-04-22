"use client";
// ─────────────────────────────────────────────
// SkillSnap — Messages Screen
// Data: messageService.getThreads() via useMessages hook
// Integration: real-time via Supabase/Socket.io
// ─────────────────────────────────────────────
import { Edit, MessageSquare } from "lucide-react";
import type { Screen } from "@/types";
import { useMessages } from "@/hooks/useMessages";
import { useAppState } from "@/state/AppState";
import SearchBar from "./shared/SearchBar";
import MessageThreadItem from "./shared/MessageThreadItem";

interface MessagesScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function MessagesScreen({ onNavigate: _onNavigate }: MessagesScreenProps) {
  const { threads, openThread } = useMessages();
  const { state } = useAppState();

  // threads is an empty array both while loading and when truly empty;
  // use auth state to infer a brief loading phase on first mount.
  const isLoading = state.authLoading;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Messages</h1>
          <button className="p-2 text-[#6c47ff]">
            <Edit size={20} />
          </button>
        </div>
        <SearchBar />
      </header>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 divide-y divide-[#f0eeea]">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/5" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))
        ) : threads.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#ede9fe] flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-[#6c47ff]" />
            </div>
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No messages yet</p>
            <p className="text-xs text-[#b0aaa5]">
              Tap Connect on a skiller's profile to start a conversation
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <MessageThreadItem
              key={thread.id}
              thread={thread}
              onClick={() => openThread(thread.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
