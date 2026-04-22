"use client";
// ─────────────────────────────────────────────
// SkillSnap — Chat Thread Screen
// Participant resolved from: active thread → viewingUserId → mock fallback
// ─────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, MoreVertical, Send, Paperclip, Info } from "lucide-react";
import type { Screen, User } from "@/types";
import { MOCK_USERS } from "@/mock-data/users";
import { useAppState } from "@/state/AppState";
import { useChat } from "@/hooks/useChat";
import UserAvatar from "./shared/UserAvatar";

interface ChatScreenProps {
  onNavigate: (s: Screen) => void;
}

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export default function ChatScreen({ onNavigate }: ChatScreenProps) {
  const { state } = useAppState();
  const { messages, inputText, setInputText, sending, sendMessage } = useChat();
  const [participant, setParticipant] = useState<User | null>(null);

  const participantId = state.activeThreadParticipantId ?? state.viewingUserId;

  useEffect(() => {
    if (!participantId) {
      setParticipant(MOCK_USERS[0]);
      return;
    }

    // Try resolving from the active thread's participant data first
    const threadParticipant = state.threads.find((t) => t.id === state.activeThreadId)?.participant;
    if (threadParticipant) {
      setParticipant(threadParticipant);
      return;
    }

    // Fall back to mock for dev mode or if threads haven't loaded yet
    const mockUser = MOCK_USERS.find((u) => u.id === participantId);
    if (mockUser || !SUPABASE_CONFIGURED) {
      setParticipant(mockUser ?? MOCK_USERS[0]);
      return;
    }

    // Fetch from DB if Supabase is configured
    import("@/services/userService").then(({ userService }) => {
      userService.getUser(participantId).then((u) => {
        setParticipant(u ?? MOCK_USERS[0]);
      });
    });
  }, [participantId, state.threads, state.activeThreadId]);

  const displayParticipant = participant ?? MOCK_USERS[0];
  const inputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14 flex-shrink-0">
        <button onClick={() => onNavigate("messages")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => onNavigate("client-profile")}
          className="flex items-center gap-2.5 flex-1"
        >
          <UserAvatar user={displayParticipant} size="sm" />
          <div>
            <p className="text-sm font-bold text-[#1a1a1a] leading-tight">{displayParticipant.displayName}</p>
            <p className="text-[11px] text-[#6c47ff] font-medium">
              {[displayParticipant.skill, displayParticipant.location].filter(Boolean).join(" · ")}
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

      {/* Messages — flex-1 so it fills space above the input bar */}
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

      {/* Jobs Done verification request */}
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
        className="flex-shrink-0 bg-white border-t border-[#e8e4df] px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {/* Hidden file input for attachments */}
        <input
          ref={attachRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Placeholder: show filename in message input until upload is wired up
              setInputText(`[Attachment: ${file.name}]`);
              inputRef.current?.focus();
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => attachRef.current?.click()}
          className="text-[#7a7570] flex-shrink-0 active:text-[#6c47ff] transition-colors"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Message..."
          autoComplete="off"
          className="flex-1 bg-[#f0eeea] rounded-2xl px-4 py-2.5 min-h-[40px] text-sm text-[#1a1a1a] placeholder-[#b0aaa5] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/30"
        />
        <button
          type="button"
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
