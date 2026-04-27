"use client";
import { useState, useRef, useCallback } from "react";
import { Heart, Share2, Bookmark, MapPin, Volume2, VolumeX } from "lucide-react";
import type { Post } from "@/types";
import type { Screen } from "@/types";
import { formatLikes } from "@/mock-data/posts";
import { useFeed } from "@/hooks/useFeed";
import { useMessages } from "@/hooks/useMessages";
import { useAppState } from "@/state/AppState";
import SearchBar from "./shared/SearchBar";
import UserAvatar from "./shared/UserAvatar";
import SkillSnapLogo from "./shared/SkillSnapLogo";
import ConnectButton from "./shared/ConnectButton";
import { useToast } from "./shared/Toast";

interface HomeFeedProps {
  onNavigate: (s: Screen) => void;
}

// Header height in px — card fills exactly the remaining viewport
const HEADER_H = 88;

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

export default function HomeFeed({ onNavigate }: HomeFeedProps) {
  const { posts, loading, likedPosts, savedPosts, toggleLike, toggleSave } = useFeed();
  const { connectTo, connecting } = useMessages();
  const { state, dispatch } = useAppState();
  const { comingSoon } = useToast();

  function requireAuth(action: () => void) {
    if (state.isGuest) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  function handleProfileClick(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("client-profile");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Sticky header — height tracked by HEADER_H */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-3 pb-3 w-full">
        <div className="flex items-center justify-between mb-2.5">
          <SkillSnapLogo />
          <button
            onClick={() => comingSoon("Location-based filtering")}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#4a4a4a] border border-[#e8e4df] rounded-full px-3 py-1.5 bg-white active:bg-[#f0eeea] transition-colors"
          >
            <MapPin size={13} className="text-[#6c47ff]" />
            Nearby
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-0.5 opacity-50">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <SearchBar onFocus={() => onNavigate("search")} />
      </header>

      {/* Feed — free scroll */}
      <div
        className="overflow-y-auto no-scrollbar"
        style={{ height: `calc(100dvh - ${HEADER_H}px)` }}
      >
        {loading && posts.length === 0 ? (
          <div className="w-full bg-gray-200 animate-pulse" style={{ height: `calc(100dvh - ${HEADER_H}px)` }} />
        ) : (
          posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              isLiked={likedPosts.has(post.id)}
              isSaved={savedPosts.has(post.id)}
              onLike={() => requireAuth(() => toggleLike(post.id))}
              onSave={() => requireAuth(() => toggleSave(post.id))}
              onProfileClick={() => handleProfileClick(post.authorId)}
              onConnectClick={() => requireAuth(() => connectTo(post.authorId))}
              onShare={() => {
                const text = post.caption || "Check out this skill on SkillSnap!";
                if (navigator.share) navigator.share({ title: "SkillSnap", text }).catch(() => {});
                else navigator.clipboard?.writeText(text).catch(() => {});
              }}
              connecting={connecting}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FeedCard({
  post, isLiked, isSaved, onLike, onSave, onProfileClick, onConnectClick, onShare, connecting,
}: {
  post: Post;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onProfileClick: () => void;
  onConnectClick: () => void;
  onShare: () => void;
  connecting: boolean;
}) {
  const { author } = post;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMediaTap = useCallback(() => {
    if (!post.mediaUrl || post.type !== "video") return;
    if (playing) { videoRef.current?.pause(); setPlaying(false); }
    else { videoRef.current?.play().catch(() => {}); setPlaying(true); }
  }, [playing, post.mediaUrl, post.type]);

  const displayLocation = post.location ?? author.location;
  // Safe happy percent — guard against undefined from real DB
  const happyPct = author.happyPercent !== undefined && author.happyPercent !== null
    ? `${author.happyPercent}%` : "—";

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-900 flex-shrink-0 mb-2"
      style={{ height: `calc(100dvh - ${HEADER_H}px - 8px)` }}
    >
      {/* ── Media ── */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleMediaTap}>
        {post.type === "video" && post.mediaUrl ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            className="w-full h-full object-cover"
            loop playsInline preload="metadata"
            muted={muted}
            poster={post.thumbnailUrl}
            onEnded={() => setPlaying(false)}
          />
        ) : post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={post.caption} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: post.thumbnailGradient }} />
        )}
        {/* Scrim */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 52%, rgba(0,0,0,0.65) 76%, rgba(0,0,0,0.85) 100%)",
        }} />
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
        <span className="text-white/70 text-[12px] font-medium">{timeAgo(post.createdAt)}</span>
        {post.type === "video" && post.mediaUrl && (
          <button
            className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
            onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
      </div>

      {/* ── Play button ── */}
      {post.type === "video" && !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "2px solid rgba(255,255,255,0.28)" }}>
            <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
              <path d="M1 1l18 11-18 11V1z" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Right actions ── */}
      <div className="absolute right-3 z-10 flex flex-col items-center gap-5" style={{ bottom: 220 }}>
        <RightAction
          icon={<Heart size={26} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "white"} strokeWidth={1.8} />}
          label={formatLikes(post.likes + (isLiked ? 1 : 0))}
          onClick={onLike}
        />
        <RightAction
          icon={<Share2 size={24} stroke="white" strokeWidth={1.8} />}
          label="Share"
          onClick={onShare}
        />
        <RightAction
          icon={<Bookmark size={24} fill={isSaved ? "white" : "none"} stroke="white" strokeWidth={1.8} />}
          label={isSaved ? "Saved" : "Save"}
          onClick={onSave}
          active={isSaved}
        />
      </div>

      {/* ── Bottom panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5">
        {/* User row */}
        <div className="flex items-center gap-3 mb-2.5">
          <div className="cursor-pointer flex-shrink-0" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>
            <UserAvatar user={author} size="sm" showVerified ring />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-[15px] leading-tight">{author.displayName}</span>
              {author.isVerified && (
                <span className="w-[17px] h-[17px] rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-white/60 text-[12px] mt-0.5">{author.skill}</p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-white/88 text-[13px] leading-snug mb-3 line-clamp-2">{post.caption}</p>
        )}

        {/* ── Stats bar ── */}
        <div
          className="flex items-stretch mb-3 rounded-2xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(10px)" }}
        >
          <StatCell value={fmtNum(author.jobsDone)} label="Jobs Done" icon={
            <svg width="14" height="13" viewBox="0 0 16 14" fill="white">
              <path d="M6 0h4a1 1 0 011 1v1h3a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h3V1a1 1 0 011-1zm0 2h4V1H6v1zM1 6v1h14V6H1zm0 2v4h14V8H1z"/>
            </svg>
          } />
          <VSep />
          <StatCell value={fmtNum(author.followers)} label="Connections" icon={
            <svg width="14" height="13" viewBox="0 0 16 14" fill="white">
              <path d="M6 7a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H1zm10-6a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm1.5 1.5c1.8.4 3 1.8 3 3.5h-3"/>
            </svg>
          } />
          <VSep />
          <StatCell value={happyPct} label="Happy" icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          } green />
          {displayLocation && (
            <>
              <VSep />
              <LocationCell
                distanceKm={author.distanceKm}
                location={displayLocation}
                onPress={onProfileClick}
              />
            </>
          )}
        </div>

        <ConnectButton onClick={onConnectClick} fullWidth loading={connecting} />
      </div>
    </div>
  );
}

function StatCell({ value, label, icon, green }: {
  value: string; label: string; icon: React.ReactNode; green?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1">
      <span className="leading-none mb-0.5">{icon}</span>
      <span className={`text-[14px] font-extrabold leading-tight tracking-tight ${green ? "text-[#4ade80]" : "text-white"}`}>
        {value}
      </span>
      <span className="text-[10px] text-white/55 font-medium leading-tight text-center">{label}</span>
    </div>
  );
}

const MAX_SUBURB_CHARS = 12;

function LocationCell({ distanceKm, location, onPress }: {
  distanceKm?: number; location: string; onPress: () => void;
}) {
  const suburb = location.split(",")[0].trim();
  const truncated = suburb.length > MAX_SUBURB_CHARS ? suburb.slice(0, MAX_SUBURB_CHARS) + "…" : suburb;
  const distanceLabel = distanceKm !== undefined ? `${distanceKm}km` : "—";

  return (
    <button
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 active:opacity-70 transition-opacity"
      onClick={(e) => { e.stopPropagation(); onPress(); }}
    >
      <span className="leading-none mb-0.5">
        <svg width="11" height="14" viewBox="0 0 11 14" fill="white">
          <path d="M5.5 0A5.5 5.5 0 000 5.5C0 9.625 5.5 14 5.5 14S11 9.625 11 5.5A5.5 5.5 0 005.5 0zm0 7.5a2 2 0 110-4 2 2 0 010 4z"/>
        </svg>
      </span>
      <span className="text-[14px] font-extrabold leading-tight tracking-tight text-white">
        {distanceLabel}
      </span>
      <span className="text-[10px] text-white/55 font-medium leading-tight text-center">{truncated}</span>
    </button>
  );
}

function VSep() {
  return <div className="w-px bg-white/15 self-stretch my-2" />;
}

function RightAction({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform" onClick={onClick}>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: active ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.30)",
          backdropFilter: "blur(6px)",
          border: "1.5px solid rgba(255,255,255,0.16)",
        }}
      >
        {icon}
      </div>
      <span className="text-white text-[11px] font-semibold">{label}</span>
    </button>
  );
}
