"use client";
import { Heart, Share2, MapPin, Bookmark, Search, MessageSquare } from "lucide-react";
import JobsTooltip from "./JobsTooltip";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "auth" | "chat" | "client-profile";

interface HomeFeedProps {
  onNavigate: (s: Screen) => void;
}

const feedItems = [
  {
    id: 1,
    username: "Marcus_Cuts",
    displayName: "Marcus Thompson",
    skill: "Barber",
    location: "Liverpool, NSW",
    caption: "Fresh fade for the weekend 🔥 Skin fade with razor sharp lines — book me for your next cut!",
    likes: "2.4k",
    jobsCompleted: 47,
    gradient: "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    avatarGradient: "linear-gradient(135deg, #667eea, #764ba2)",
    avatarInitial: "M",
    verified: true,
  },
  {
    id: 2,
    username: "PriyaGlam",
    displayName: "Priya Kaur",
    skill: "Makeup Artist",
    location: "Parramatta, NSW",
    caption: "Bridal look for Sarah's big day 💕 Full glam, soft glitter eye, and flawless base. DM to book!",
    likes: "5.1k",
    jobsCompleted: 83,
    gradient: "linear-gradient(160deg, #2d1b33 0%, #4a1942 50%, #6b2d6b 100%)",
    avatarGradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    avatarInitial: "P",
    verified: true,
  },
  {
    id: 3,
    username: "JakeTheTiler",
    displayName: "Jake Richardson",
    skill: "Tiler",
    location: "Penrith, NSW",
    caption: "Herringbone bathroom reno complete ✅ 12 sqm transformation — client was stoked. Ask me for a free quote.",
    likes: "1.8k",
    jobsCompleted: 29,
    gradient: "linear-gradient(160deg, #0d2137 0%, #1a3a5c 50%, #1e5680 100%)",
    avatarGradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    avatarInitial: "J",
    verified: false,
  },
];

export default function HomeFeed({ onNavigate }: HomeFeedProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-3 pb-3">
        {/* Brand row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}>
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="3" fill="none" />
                <circle cx="20" cy="20" r="5" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#1a1a1a] tracking-tight">SkillSnap</span>
          </div>
          <button className="p-1.5 text-[#7a7570]">
            <Bookmark size={20} />
          </button>
        </div>
        {/* Search bar */}
        <div className="flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-10">
          <Search size={15} className="text-[#b0aaa5] flex-shrink-0" />
          <span className="text-[#b0aaa5] text-sm">Search skills, people, or location</span>
        </div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} onProfileClick={() => onNavigate("profile")} onChatClick={() => onNavigate("chat")} />
        ))}
      </div>
    </div>
  );
}

function FeedCard({
  item,
  onProfileClick,
  onChatClick,
}: {
  item: (typeof feedItems)[0];
  onProfileClick: () => void;
  onChatClick: () => void;
}) {
  return (
    <div className="relative w-full aspect-[9/16] max-h-[85vh] overflow-hidden bg-gray-900 mb-2">
      {/* Video thumbnail bg */}
      <div className="absolute inset-0" style={{ background: item.gradient }} />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", border: "2px solid rgba(255,255,255,0.3)" }}>
          <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
            <path d="M1 1l18 11-18 11V1z" />
          </svg>
        </div>
      </div>

      {/* Right side actions — Like, Chat, Share */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-5">
        <ActionBtn icon={<Heart size={24} />} count={item.likes} />
        <ActionBtn icon={<MessageSquare size={24} />} count="Chat" onClick={onChatClick} />
        <ActionBtn icon={<Share2 size={24} />} count="Share" />
      </div>

      {/* Bottom overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pt-16 pb-4"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)" }}
      >
        {/* User info row */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <button
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white/40"
            style={{ background: item.avatarGradient }}
          >
            {item.avatarInitial}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-sm leading-tight">{item.username}</span>
              {item.verified && (
                <span className="w-4 h-4 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="white">
                    <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#6c47ff]"
                style={{ background: "rgba(108,71,255,0.2)", backdropFilter: "blur(4px)" }}>
                {item.skill}
              </span>
              <span className="flex items-center gap-0.5 text-white/70 text-xs">
                <MapPin size={10} />
                {item.location}
              </span>
            </div>
          </div>
        </div>

        {/* Jobs Completed trust signal */}
        <div className="mb-2">
          <JobsTooltip count={item.jobsCompleted} dark size="xs" />
        </div>

        {/* Caption */}
        <p className="text-white/90 text-sm leading-snug mb-3 line-clamp-2">{item.caption}</p>

        {/* Chat CTA — replaces Connect */}
        <button
          onClick={onChatClick}
          className="w-full h-11 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          <MessageSquare size={16} strokeWidth={2.5} />
          Message
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ icon, count, onClick }: { icon: React.ReactNode; count: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
        {icon}
      </button>
      <span className="text-white text-xs font-medium">{count}</span>
    </div>
  );
}
