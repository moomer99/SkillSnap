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
          <button className="flex items-center gap-1 text-xs font-semibold text-[#7a7570] border border-[#e8e4df] rounded-full px-3 py-1.5">
            <MapPin size={12} className="text-[#6c47ff]" />
            Nearby
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-0.5">
              <path d="M2 4l3 3 3-3" stroke="#7a7570" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <SearchBar />
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {loading && posts.length === 0 ? (
          <div className="w-full aspect-[9/16] max-h-[85vh] bg-gray-200 animate-pulse mb-2" />
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
  post,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onProfileClick,
  onConnectClick,
  onShare,
  connecting,
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

  const handlePlayToggle = useCallback(() => {
    if (!post.mediaUrl || post.type !== "video") return;
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing, post.mediaUrl, post.type]);

  const formatFollowers = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);

  return (
    <div className="relative w-full bg-white mb-0.5 overflow-hidden" style={{ minHeight: "100dvh", maxHeight: "100dvh" }}>
      {/* ── Media layer ── */}
      <div className="absolute inset-0" onClick={handlePlayToggle}>
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

        {/* Dark scrim — top + bottom */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.75) 100%)" }}
        />
      </div>

      {/* ── Top row: timestamp + mute ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
        <span className="text-white/70 text-xs font-medium">{timeAgo(post.createdAt)}</span>
        {post.type === "video" && post.mediaUrl && (
          <button
            className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
            onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
      </div>

      {/* ── Right-side actions ── */}
      <div className="absolute right-3 z-10 flex flex-col items-center gap-5"
        style={{ bottom: "calc(210px)" }}>
        <SideAction
          icon={<Heart size={26} fill={isLiked ? "white" : "none"} stroke="white" strokeWidth={1.8} />}
          label={formatLikes(post.likes + (isLiked ? 1 : 0))}
          onClick={onLike}
          active={isLiked}
          activeColor="rgba(239,68,68,0.5)"
        />
        <SideAction
          icon={<Share2 size={24} stroke="white" strokeWidth={1.8} />}
          label="Share"
          onClick={onShare}
        />
        <SideAction
          icon={<Bookmark size={24} fill={isSaved ? "white" : "none"} stroke="white" strokeWidth={1.8} />}
          label={isSaved ? "Saved" : "Save"}
          onClick={onSave}
          active={isSaved}
          activeColor="rgba(108,71,255,0.5)"
        />
      </div>

      {/* ── Play button overlay (video only) ── */}
      {post.type === "video" && !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "2px solid rgba(255,255,255,0.3)" }}>
            <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
              <path d="M1 1l18 11-18 11V1z" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Bottom info panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 pt-3">
        {/* User row */}
        <div className="flex items-center gap-3 mb-2">
          <UserAvatar user={author} size="sm" showVerified ring onClick={onProfileClick} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-[15px] leading-tight">{author.displayName}</span>
              {author.isVerified && (
                <span className="w-4 h-4 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="white">
                    <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-white/70 text-xs mt-0.5">{author.skill}</p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-white/90 text-[13px] leading-snug mb-3 line-clamp-2">{post.caption}</p>
        )}

        {/* Stats bar — Jobs Done · Followers · Happy · Distance */}
        <div className="flex items-center gap-0 mb-3 bg-black/30 rounded-xl px-3 py-2.5 backdrop-blur-sm">
          <StatPill
            icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.2l-3.7 2.1.7-4.1-3-2.9 4.2-.7L8 1z" fill="white"/></svg>}
            value={author.jobsDone >= 1000 ? `${(author.jobsDone/1000).toFixed(0)}k` : String(author.jobsDone)}
            label="Jobs Done"
          />
          <div className="w-px h-6 bg-white/20 mx-2" />
          <StatPill
            icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zM7 11V7h2v4H7zm0-6V3h2v2H7z" fill="white"/></svg>}
            value={formatFollowers(author.followers)}
            label="Followers"
          />
          <div className="w-px h-6 bg-white/20 mx-2" />
          <StatPill
            icon={<span className="text-[11px]">😊</span>}
            value={`${author.happyPercent}%`}
            label="Happy"
            highlight
          />
          {author.distanceKm !== undefined && (
            <>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <StatPill
                icon={<MapPin size={12} stroke="white" fill="none" />}
                value={`${author.distanceKm}km`}
                label=""
              />
            </>
          )}
        </div>

        {/* Connect button */}
        <ConnectButton onClick={onConnectClick} fullWidth loading={connecting} />
      </div>
    </div>
  );
}

function StatPill({
  icon, value, label, highlight,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="flex-shrink-0">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className={`text-[12px] font-bold ${highlight ? "text-[#86efac]" : "text-white"}`}>{value}</span>
        {label && <span className="text-[9px] text-white/55 font-medium">{label}</span>}
      </div>
    </div>
  );
}

function SideAction({
  icon, label, onClick, active, activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{
          background: active && activeColor ? activeColor : "rgba(0,0,0,0.3)",
          backdropFilter: "blur(6px)",
          border: "1.5px solid rgba(255,255,255,0.15)",
        }}
      >
        {icon}
      </button>
      <span className="text-white text-[10px] font-semibold">{label}</span>
    </div>
  );
}
