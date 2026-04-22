"use client";
import { Search, Edit } from "lucide-react";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "auth" | "chat" | "client-profile";

interface MessagesScreenProps {
  onNavigate: (s: Screen) => void;
}

const conversations = [
  {
    id: 1,
    name: "Marcus Thompson",
    username: "@Marcus_Cuts",
    lastMsg: "Sure! I have a slot this Saturday at 2pm, does that work?",
    time: "2m",
    unread: 2,
    avatarGradient: "linear-gradient(135deg, #667eea, #764ba2)",
    initial: "M",
    skill: "Barber",
  },
  {
    id: 2,
    name: "Priya Kaur",
    username: "@PriyaGlam",
    lastMsg: "Here are some looks from my recent bridal session ✨",
    time: "14m",
    unread: 0,
    avatarGradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    initial: "P",
    skill: "Makeup Artist",
  },
  {
    id: 3,
    name: "Jake Richardson",
    username: "@JakeTheTiler",
    lastMsg: "I can come do a free quote on Thursday if you're around",
    time: "1h",
    unread: 1,
    avatarGradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    initial: "J",
    skill: "Tiler",
  },
  {
    id: 4,
    name: "Sam Williams",
    username: "@SamFitPro",
    lastMsg: "Just posted my new 6-week transformation! Check it out",
    time: "3h",
    unread: 0,
    avatarGradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
    initial: "S",
    skill: "Fitness / PT",
  },
  {
    id: 5,
    name: "Ana Martinez",
    username: "@AnaPristineClean",
    lastMsg: "Thank you! Glad you were happy with the service 😊",
    time: "1d",
    unread: 0,
    avatarGradient: "linear-gradient(135deg, #fa709a, #fee140)",
    initial: "A",
    skill: "Cleaning",
  },
];

export default function MessagesScreen({ onNavigate }: MessagesScreenProps) {
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
        {/* Search */}
        <div className="flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-10">
          <Search size={15} className="text-[#b0aaa5] flex-shrink-0" />
          <span className="text-[#b0aaa5] text-sm">Search skills, people, or location</span>
        </div>
      </header>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 divide-y divide-[#f0eeea]">
        {conversations.map((convo) => (
          <button
            key={convo.id}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-[#f8f7f5] transition-colors text-left"
            onClick={() => onNavigate("chat")}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold"
                style={{ background: convo.avatarGradient }}
              >
                {convo.initial}
              </div>
              {convo.unread > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#6c47ff] flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">{convo.unread}</span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm ${convo.unread > 0 ? "font-bold text-[#1a1a1a]" : "font-semibold text-[#1a1a1a]"}`}>
                  {convo.name}
                </span>
                <span className={`text-[11px] flex-shrink-0 ml-2 ${convo.unread > 0 ? "text-[#6c47ff] font-semibold" : "text-[#b0aaa5]"}`}>
                  {convo.time}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0eeea] text-[#7a7570] font-medium flex-shrink-0">
                  {convo.skill}
                </span>
              </div>
              <p className={`text-xs mt-0.5 truncate ${convo.unread > 0 ? "text-[#1a1a1a] font-medium" : "text-[#7a7570]"}`}>
                {convo.lastMsg}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
