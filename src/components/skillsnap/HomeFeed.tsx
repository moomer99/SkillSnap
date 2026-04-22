"use client";
// ─────────────────────────────────────────────
// SkillSnap — Home Feed Screen
// Data: postService.getFeed() via useFeed hook
// State: likedPosts, savedPosts via AppState
// ─────────────────────────────────────────────
import { Heart, Share2, MapPin, Bookmark } from "lucide-react";
import type { Post } from "@/types";
import type { Screen } from "@/types";
import { formatLikes } from "@/mock-data/posts";
import { useFeed } from "@/hooks/useFeed";
import { useAppState } from "@/state/AppState";
import SearchBar from "./shared/SearchBar";
import JobsDoneBadge from "./shared/JobsDoneBadge";
import ConnectButton from "./shared/ConnectButton";
import UserAvatar from "./shared/UserAvatar";
import SkillSnapLogo from "./shared/SkillSnapLogo";

interface HomeFeedProps {
  onNavigate: (s: Screen) => void;
}

export default function HomeFeed({ onNavigate }: HomeFeedProps) {
  const { posts, likedPosts, savedPosts, toggleLike, toggleSave } = useFeed();
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
          <button className="p-1.5 text-[#7a7570]">
            <Bookmark size={20} />
          </button>
        </div>
        <SearchBar />
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            isLiked={likedPosts.has(post.id)}
            isSaved={savedPosts.has(post.id)}
            onLike={() => toggleLike(post.id)}
            onSave={() => toggleSave(post.id)}
            onProfileClick={() => handleProfileClick(post.authorId)}
            onConnectClick={() => onNavigate("chat")}
          />
        ))}
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
}: {
  post: Post;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onProfileClick: () => void;
  onConnectClick: () => void;
}) {
  const { author } = post;
  const displayLikes = formatLikes(post.likes + (isLiked ? 1 : 0));

  return (
    <div className="relative w-full aspect-[9/16] max-h-[85vh] overflow-hidden bg-gray-900 mb-2">
      {/* Video thumbnail */}
      <div className="absolute inset-0" style={{ background: post.thumbnailGradient }} />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", border: "2px solid rgba(255,255,255,0.3)" }}>
          <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
            <path d="M1 1l18 11-18 11V1z" />
          </svg>
        </div>
      </div>

      {/* Right side actions — Like + Share */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-5">
        <ActionBtn
          icon={<Heart size={24} fill={isLiked ? "white" : "none"} />}
          count={displayLikes}
          onClick={onLike}
          active={isLiked}
        />
        <ActionBtn icon={<Share2 size={24} />} count="Share" />
      </div>

      {/* Bottom overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pt-16 pb-4"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)" }}
      >
        {/* User info */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <UserAvatar
            user={author}
            size="sm"
            showVerified
            ring
            onClick={onProfileClick}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-semibold text-sm leading-tight">{author.username}</span>
              {author.isVerified && (
                <span className="w-4 h-4 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="white">
                    <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {/* Jobs Done inline badge */}
              <JobsDoneBadge count={author.jobsDone} dark size="xs" inline />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {author.skill && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#6c47ff]"
                  style={{ background: "rgba(108,71,255,0.2)", backdropFilter: "blur(4px)" }}>
                  {author.skill}
                </span>
              )}
              <span className="flex items-center gap-0.5 text-white/70 text-xs">
                <MapPin size={10} />
                {author.location}
              </span>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="text-white/90 text-sm leading-snug mb-3 line-clamp-2">{post.caption}</p>

        {/* Connect CTA */}
        <ConnectButton onClick={onConnectClick} fullWidth />
      </div>
    </div>
  );
}

function ActionBtn({ icon, count, onClick, active }: { icon: React.ReactNode; count: string; onClick?: () => void; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
        style={{ background: active ? "rgba(108,71,255,0.5)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
        {icon}
      </button>
      <span className="text-white text-xs font-medium">{count}</span>
    </div>
  );
}
