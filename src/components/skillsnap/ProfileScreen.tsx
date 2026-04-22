"use client";
import { MapPin, ArrowLeft, Play, Share2, Edit3, MessageSquare } from "lucide-react";
import JobsTooltip from "./JobsTooltip";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "own-profile" | "auth" | "chat" | "client-profile";

interface ProfileScreenProps {
  variant?: "own" | "other" | "client";
  onNavigate: (s: Screen) => void;
}

const workItems = [
  { gradient: "linear-gradient(135deg, #1a1a2e, #0f3460)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #2d1b33, #6b2d6b)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #0d2137, #1e5680)", hasVideo: false },
  { gradient: "linear-gradient(135deg, #1a3a1a, #2d6b2d)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #3a1a1a, #8b3333)", hasVideo: false },
  { gradient: "linear-gradient(135deg, #2a1a3a, #5b3dd8)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #1a2a3a, #1e4d7a)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #3a2a1a, #7a5228)", hasVideo: false },
  { gradient: "linear-gradient(135deg, #1a3a2a, #2d7a5b)", hasVideo: true },
];

const savedItems = [
  { gradient: "linear-gradient(135deg, #667eea, #764ba2)", hasVideo: true, label: "Barber" },
  { gradient: "linear-gradient(135deg, #f093fb, #f5576c)", hasVideo: true, label: "Makeup" },
  { gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", hasVideo: false, label: "Tiler" },
  { gradient: "linear-gradient(135deg, #43e97b, #38f9d7)", hasVideo: true, label: "PT" },
  { gradient: "linear-gradient(135deg, #fa709a, #fee140)", hasVideo: false, label: "Cleaner" },
  { gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)", hasVideo: true, label: "Nails" },
];

export default function ProfileScreen({ variant = "other", onNavigate }: ProfileScreenProps) {
  const isOwn = variant === "own";
  const isClient = variant === "client";

  const name = isClient ? "Jordan Lee" : "Marcus Thompson";
  const username = isClient ? "@jordan_lee" : "@Marcus_Cuts";
  const skill = isClient ? null : "Barber";
  const location = "Liverpool, NSW";
  const bio = isClient
    ? "Love discovering talented locals. Always looking for quality tradies and stylists in the area."
    : "Professional barber with 8+ years experience. Specialising in fades, skin fades & modern cuts.";
  const avatarGradient = isClient
    ? "linear-gradient(135deg, #43e97b, #38f9d7)"
    : "linear-gradient(135deg, #667eea, #764ba2)";
  const initial = isClient ? "J" : "M";

  const jobsDone = isClient ? 0 : 47;
  const followers = isClient ? "12" : "1.2k";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("home")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[#1a1a1a] text-sm flex-1">{username}</span>
        {isOwn ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#ede9fe] text-[#5b3dd8]">
            Your Profile
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: isClient ? "#d1fae5" : "#ede9fe", color: isClient ? "#065f46" : "#5b3dd8" }}>
            {isClient ? "Client" : "Pro"}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Profile card */}
        <div className="bg-white px-5 pt-6 pb-5 border-b border-[#e8e4df]">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: avatarGradient, boxShadow: "0 0 0 3px #ede9fe" }}
              >
                {initial}
              </div>
              {!isClient && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#6c47ff] flex items-center justify-center ring-2 ring-white">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="white">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Stats: Posts / Jobs Done / Followers */}
            <div className="flex-1 grid grid-cols-3 gap-1 pt-2">
              {isClient ? (
                <Stat value="—" label="Saved" />
              ) : (
                <Stat value={String(workItems.length)} label="Posts" />
              )}
              {!isClient && <Stat value={String(jobsDone)} label="Jobs Done" highlight />}
              {isClient && <Stat value="—" label="Jobs Done" />}
              <Stat value={followers} label="Followers" />
            </div>
          </div>

          {/* Name + skill + location */}
          <div className="mb-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-base text-[#1a1a1a]">{name}</h2>
              {skill && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#5b3dd8]">
                  {skill}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[#7a7570] text-xs mb-2">
              <MapPin size={11} />
              <span>{location}</span>
            </div>
            <p className="text-sm text-[#4a4a4a] leading-relaxed">{bio}</p>
          </div>

          {/* Jobs Done tooltip row — only for skilled users */}
          {!isClient && (
            <div className="mt-2 mb-1">
              <JobsTooltip count={jobsDone} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 mt-4">
            {isOwn ? (
              <>
                <button className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
                  <Edit3 size={14} />
                  Edit Profile
                </button>
                <button className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
                  <Share2 size={14} />
                  Share
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("chat")}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
                >
                  <MessageSquare size={14} strokeWidth={2.5} />
                  Connect
                </button>
                <button className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#6c47ff] border-2 border-[#6c47ff] bg-white transition-all active:scale-[0.98]">
                  Follow
                </button>
              </>
            )}
          </div>
        </div>

        {/* Work / Saved section */}
        <div className="px-1 pt-3">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-sm font-bold text-[#1a1a1a]">
              {isClient ? "Saved Posts" : "My Work"}
            </h3>
            {!isClient && (
              <span className="text-xs text-[#7a7570]">{workItems.length} posts</span>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-0.5 px-0.5">
            {(isClient ? savedItems : workItems).map((item, i) => (
              <div key={i} className="aspect-square relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: item.gradient }} />
                {item.hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                      <Play size={12} fill="white" color="white" />
                    </div>
                  </div>
                )}
                {isClient && (item as typeof savedItems[0]).label && (
                  <div className="absolute bottom-1.5 left-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                      {(item as typeof savedItems[0]).label}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-bold text-base ${highlight ? "text-[#6c47ff]" : "text-[#1a1a1a]"}`}>{value}</span>
      <span className="text-[11px] text-[#7a7570]">{label}</span>
    </div>
  );
}
