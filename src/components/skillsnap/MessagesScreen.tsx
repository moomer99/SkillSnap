"use client";
// ─────────────────────────────────────────────
// SkillSnap — Messages Screen
// Data: messageService.getThreads() via useMessages hook
// Integration: real-time via Supabase/Socket.io
// ─────────────────────────────────────────────
import { Edit } from "lucide-react";
import type { Screen } from "@/types";
import { useMessages } from "@/hooks/useMessages";
import SearchBar from "./shared/SearchBar";
import MessageThreadItem from "./shared/MessageThreadItem";

interface MessagesScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function MessagesScreen({ onNavigate: _onNavigate }: MessagesScreenProps) {
  const { threads, openThread } = useMessages();

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
        {threads.map((thread) => (
          <MessageThreadItem
            key={thread.id}
            thread={thread}
            onClick={() => openThread(thread.id)}
          />
        ))}
      </div>
    </div>
  );
}
