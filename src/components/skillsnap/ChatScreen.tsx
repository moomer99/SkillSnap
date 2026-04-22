"use client";
// ─────────────────────────────────────────────
// SkillSnap — Chat Thread Screen
// Data: messageService.getMessages(threadId) via useChat hook
// Integration: real-time via Supabase Realtime / Socket.io
// Jobs Done: jobsDoneService.requestVerification(threadId)
// ─────────────────────────────────────────────
import { ArrowLeft, Phone, MoreVertical, Send, Paperclip, Info } from "lucide-react";
import type { Screen } from "@/types";
import { MOCK_USERS } from "@/mock-data/users";
import { useAppState } from "@/state/AppState";
import { useChat } from "@/hooks/useChat";
import UserAvatar from "./shared/UserAvatar";

interface ChatScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function ChatScreen({ onNavigate }: ChatScreenProps) {
  const { state } = useAppState();
  const { messages, inputText, setInputText, sending, sendMessage } = useChat();

  // Resolve participant: use viewingUserId if set, else fall back to first mock user
  const participant =
    MOCK_USERS.find((u) => u.id === state.viewingUserId) ?? MOCK_USERS[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("messages")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => onNavigate("profile")}
          className="flex items-center gap-2.5 flex-1"
        >
          <UserAvatar user={participant} size="sm" />
          <div>
            <p className="text-sm font-bold text-[#1a1a1a] leading-tight">{participant.displayName}</p>
            <p className="text-[11px] text-[#6c47ff] font-medium">
              {participant.skill} · {participant.location}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center text-[#7a7570]">
            <Phone size={18} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-[#7a7570]">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-6 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-[#e8e4df]" />
          <span className="text-[11px] text-[#b0aaa5] font-medium px-2">Today</span>
          <div className="flex-1 h-px bg-[#e8e4df]" />
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[78%] flex flex-col gap-0.5">
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.from === "me"
                    ? "text-white rounded-br-sm"
                    : "bg-white text-[#1a1a1a] rounded-bl-sm shadow-sm border border-[#e8e4df]"
                }`}
                style={msg.from === "me" ? { background: "linear-gradient(135deg, #6c47ff, #8b6af5)" } : {}}
              >
                {msg.text}
              </div>
              <span className={`text-[10px] text-[#b0aaa5] ${msg.from === "me" ? "text-right" : "text-left"} px-1`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs Done verification request (disabled until interaction threshold) */}
      <div className="px-4 pb-2">
        <button
          disabled
          className="w-full h-10 rounded-2xl font-semibold text-xs border-2 border-dashed border-[#d0ccc8] text-[#b0aaa5] flex items-center justify-center gap-2 bg-white cursor-not-allowed"
        >
          <Info size={14} />
          Send Job Completion Request
          <span className="ml-1 text-[9px] bg-[#f0eeea] text-[#b0aaa5] px-1.5 py-0.5 rounded-full font-semibold">
            After interaction
          </span>
        </button>
        <p className="text-center text-[10px] text-[#b0aaa5] mt-1">
          Available after continued conversation
        </p>
      </div>

      {/* Input bar */}
      <div
        className="sticky bottom-0 bg-white border-t border-[#e8e4df] px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <button className="text-[#7a7570] flex-shrink-0">
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Message..."
          className="flex-1 bg-[#f0eeea] rounded-2xl px-4 py-2.5 min-h-[40px] text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
