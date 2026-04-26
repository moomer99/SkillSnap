"use client";
import { useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import type { Screen } from "@/types";
import { useMessages } from "@/hooks/useMessages";
import MessageThreadItem from "./shared/MessageThreadItem";

interface MessagesScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function MessagesScreen({ onNavigate: _onNavigate }: MessagesScreenProps) {
  const { threads, threadsLoading, openThread } = useMessages();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? threads.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.participant.displayName.toLowerCase().includes(q) ||
          t.participant.skill?.toLowerCase().includes(q) ||
          t.participant.location?.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q)
        );
      })
    : threads;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Messages</h1>
          {threads.length > 0 && (
            <span className="text-xs font-bold bg-[#6c47ff] text-white px-2 py-0.5 rounded-full">
              {threads.reduce((n, t) => n + t.unreadCount, 0) || threads.length}
            </span>
          )}
        </div>
        {/* Live search input */}
        <div className="flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-10">
          <Search size={15} className="text-[#b0aaa5] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, skill or location…"
            className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#b0aaa5] text-xs font-semibold">
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 divide-y divide-[#f0eeea]">
        {threadsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/5" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 && query ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No results for "{query}"</p>
            <p className="text-xs text-[#b0aaa5]">Try searching by name, skill or location</p>
          </div>
        ) : threads.length === 0 ? (
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
          filtered.map((thread) => (
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
