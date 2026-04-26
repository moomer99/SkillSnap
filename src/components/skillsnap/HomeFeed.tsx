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

interface HomeFeedProps {
  onNavigate: (s: Screen) => void;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

export default function HomeFeed({ onNavigate }: HomeFeedProps) {
  const { posts, loading, likedPosts, savedPosts, toggleLike, toggleSave } = useFeed();
  const { connectTo, connecting } = useMessages();
  const { dispatch } = useAppState();

  function handleProfileClick(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("client-profile");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <SkillSnapLogo />
          <button className="flex items-center gap-1.5 text-[13px] font-semibold text-[#4a4a4a] border border-[#e8e4df] rounded-full px-3 py-1.5 bg-white">
            <MapPin size={13} className="text-[#6c47ff]" />
            Nearby
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-0.5 opacity-50">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <SearchBar />
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 snap-y snap-mandatory">
        {loading && posts.length === 0 ? (
          <div className="w-full h-screen bg-gray-200 animate-pulse" />
        ) : (
          posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              isLiked={likedPosts.has(post.id)}
              isSaved={savedPosts.has(post.id)}
              onLike={() => toggleLike(post.id)}
              onSave={() => toggleSave(post.id)}
              onProfileClick={() => handleProfileClick(post.authorId)}
              onConnectClick={() => connectTo(post.authorId)}
              onShare={() => {
                const text = post.caption || "Check out this skill on SkillSnap!";
                if (navigator.share) {
                  navigator.share({ title: "SkillSnap", text }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text).catch(() => {});
                }
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
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing, post.mediaUrl, post.type]);

  const displayLocation = post.location ?? author.location;

  return (
    <div
      className="relative w-full snap-start overflow-hidden bg-gray-900"
      style={{ height: "100dvh" }}
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

        {/* Gradient scrim: stronger at top and bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 50%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0.88) 100%)",
          }}
        />
      </div>

      {/* ── Top bar: timestamp left, mute right ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-5 z-10">
        <span className="text-white/75 text-xs font-medium drop-shadow">{timeAgo(post.createdAt)}</span>
        {post.type === "video" && post.mediaUrl && (
          <button
            className="w-8 h-8 rounded-full bg-black/35 flex items-center justify-center text-white"
            onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
      </div>

      {/* ── Play button (video not yet playing) ── */}
      {post.type === "video" && !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(6px)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
              <path d="M1 1l18 11-18 11V1z" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Right side action stack ── */}
      <div
        className="absolute right-3 z-10 flex flex-col items-center gap-5"
        style={{ bottom: "clamp(220px, 35%, 280px)" }}
      >
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
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6">
        {/* User info row */}
        <div className="flex items-center gap-3 mb-2">
          <div className="cursor-pointer flex-shrink-0" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>
            <UserAvatar user={author} size="sm" showVerified ring />
          </div>
          <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-bold text-[15px] leading-tight">{author.displayName}</span>
              {author.isVerified && (
                <span className="w-[18px] h-[18px] rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-white/65 text-[12px] mt-0.5 leading-none">{author.skill}</p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-white/90 text-[13px] leading-snug mb-3 line-clamp-2">{post.caption}</p>
        )}

        {/* Stats pill bar — Jobs Done | Followers | 😊 Happy% | 📍 Distance */}
        <div
          className="flex items-center mb-3 rounded-2xl px-3 py-2.5 gap-0"
          style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }}
        >
          <StatCell icon="⭐" value={formatNum(author.jobsDone)} label="Jobs Done" />
          <Divider />
          <StatCell
            icon={
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="white" strokeWidth="1.4"/>
                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            }
            value={formatNum(author.followers)}
            label="Followers"
          />
          <Divider />
          <StatCell icon="😊" value={`${author.happyPercent}%`} label="Happy" green />
          {displayLocation && (
            <>
              <Divider />
              <StatCell
                icon={<MapPin size={12} stroke="white" fill="none" />}
                value={author.distanceKm !== undefined ? `${author.distanceKm}km` : ""}
                label={author.distanceKm !== undefined ? "" : displayLocation}
                location={author.distanceKm === undefined ? displayLocation : undefined}
                distanceLabel={author.distanceKm !== undefined ? displayLocation : undefined}
              />
            </>
          )}
        </div>

        {/* Connect button — same style as current */}
        <ConnectButton onClick={onConnectClick} fullWidth loading={connecting} />
      </div>
    </div>
  );
}

function RightAction({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform" onClick={onClick}>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)",
          backdropFilter: "blur(6px)",
          border: "1.5px solid rgba(255,255,255,0.18)",
        }}
      >
        {icon}
      </div>
      <span className="text-white text-[11px] font-semibold drop-shadow">{label}</span>
    </button>
  );
}

function StatCell({
  icon, value, label, green, location, distanceLabel,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  green?: boolean;
  location?: string;
  distanceLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1 px-1 min-w-0">
      <span className="flex-shrink-0 text-[13px] leading-none">{icon}</span>
      <div className="flex flex-col leading-none min-w-0">
        {value && (
          <span className={`text-[11px] font-bold leading-tight ${green ? "text-[#86efac]" : "text-white"}`}>
            {value}
          </span>
        )}
        {distanceLabel && (
          <span className="text-[9px] text-white/55 font-medium leading-tight truncate">{distanceLabel}</span>
        )}
        {label && !distanceLabel && (
          <span className="text-[9px] text-white/55 font-medium leading-tight">{label}</span>
        )}
        {location && !value && (
          <span className="text-[11px] font-semibold text-white leading-tight truncate">{location}</span>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch bg-white/20 mx-1.5" />;
}
