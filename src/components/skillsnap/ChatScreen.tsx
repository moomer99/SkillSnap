"use client";
import { ArrowLeft, Phone, MoreVertical, Send, Paperclip, Info } from "lucide-react";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "auth" | "chat" | "client-profile";

interface ChatScreenProps {
  onNavigate: (s: Screen) => void;
}

const messages = [
  { id: 1, from: "them", text: "Hey! Saw your profile on SkillSnap — love your work 🔥", time: "10:02 AM" },
  { id: 2, from: "me", text: "Hey thanks! Really appreciate that 😊", time: "10:04 AM" },
  { id: 3, from: "them", text: "I'm looking for a skin fade + beard shape. Are you taking bookings this week?", time: "10:05 AM" },
  { id: 4, from: "me", text: "Yes for sure! I have a slot Thursday at 3pm or Saturday at 11am — which works better for you?", time: "10:07 AM" },
  { id: 5, from: "them", text: "Saturday at 11am would be perfect 👌", time: "10:09 AM" },
  { id: 6, from: "me", text: "Locked in! Saturday 11am. I'll send you my location closer to the day. Any specific style inspo I should know about?", time: "10:10 AM" },
  { id: 7, from: "them", text: "I'll send a photo. Something similar to what you posted last week actually", time: "10:12 AM" },
  { id: 8, from: "me", text: "Perfect, that cut was a banger. See you Saturday 💪", time: "10:13 AM" },
];

export default function ChatScreen({ onNavigate }: ChatScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("messages")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => onNavigate("profile")} className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
            M
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a1a1a] leading-tight">Marcus Thompson</p>
            <p className="text-[11px] text-[#6c47ff] font-medium">Barber · Liverpool, NSW</p>
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
        {/* Date separator */}
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

      {/* Job Completion Request — disabled */}
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
      <div className="sticky bottom-0 bg-white border-t border-[#e8e4df] px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <button className="text-[#7a7570] flex-shrink-0">
          <Paperclip size={20} />
        </button>
        <div className="flex-1 bg-[#f0eeea] rounded-2xl px-4 py-2.5 min-h-[40px] flex items-center">
          <span className="text-[#b0aaa5] text-sm">Message...</span>
        </div>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
