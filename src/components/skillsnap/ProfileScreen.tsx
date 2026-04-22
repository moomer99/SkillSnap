"use client";
// ─────────────────────────────────────────────
// SkillSnap — Profile Screen
// variant="own"    → My Profile (current user)
// variant="client" → Client Profile (public view)
// Data: userService.getUser(id) via useProfile hook
// ─────────────────────────────────────────────
import { MapPin, ArrowLeft, Play, Share2, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Screen, ProfileVariant, Post } from "@/types";
import { MOCK_WORK_GRID } from "@/mock-data/posts";
import { useProfile } from "@/hooks/useProfile";
import { useMessages } from "@/hooks/useMessages";
import { useAppState } from "@/state/AppState";
import UserAvatar from "./shared/UserAvatar";
import ConnectButton from "./shared/ConnectButton";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

interface ProfileScreenProps {
  variant?: ProfileVariant;
  onNavigate: (s: Screen) => void;
}

export default function ProfileScreen({ variant = "client", onNavigate }: ProfileScreenProps) {
  const isOwn = variant === "own";

  const { user, isFollowing, toggleFollow } = useProfile(variant);
  const { connectTo, connecting } = useMessages();
  const { state, navigate } = useAppState();
  const [posts, setPosts] = useState<Post[]>([]);
  const [gridLoading, setGridLoading] = useState(true);

  // Load the user's posts for the work grid
  useEffect(() => {
    if (!user) return;
    setGridLoading(true);

    if (!SUPABASE_CONFIGURED) {
      setPosts([]);
      setGridLoading(false);
      return;
    }

    import("@/services/postService").then(({ postService }) => {
      postService.getUserPosts(user.id).then((p) => {
        setPosts(p);
        setGridLoading(false);
      }).catch(() => {
        setPosts([]);
        setGridLoading(false);
      });
    });
  // feedVersion triggers a grid refresh after the user posts something new
  }, [user, state.feedVersion]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  const followers = user.followers >= 1000
    ? `${(user.followers / 1000).toFixed(1)}k`
    : String(user.followers);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => navigate(state.previousScreen ?? "home")}
          className="text-[#7a7570]"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[#1a1a1a] text-sm flex-1">{user.username}</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={
            isOwn
              ? { background: "#ede9fe", color: "#5b3dd8" }
              : { background: "#d1fae5", color: "#065f46" }
          }
        >
          {isOwn ? "Your Profile" : "Client"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Profile card — identical layout for both variants */}
        <div className="bg-white px-5 pt-6 pb-5 border-b border-[#e8e4df]">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <UserAvatar user={user} size="lg" showVerified={isOwn} />

            {/* Stats: Posts · Jobs Done · Followers */}
            <div className="flex-1 grid grid-cols-3 gap-1 pt-2">
              <Stat value={String(user.postCount)} label="Posts" />
              <Stat value={String(user.jobsDone)} label="Jobs Done" highlight />
              <Stat value={followers} label="Followers" />
            </div>
          </div>

          {/* Name + skill + location + bio */}
          <div className="mb-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-base text-[#1a1a1a]">{user.displayName}</h2>
              {user.skill && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#5b3dd8]">
                  {user.skill}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[#7a7570] text-xs mb-2">
              <MapPin size={11} />
              <span>{user.location}</span>
            </div>
            <p className="text-sm text-[#4a4a4a] leading-relaxed">{user.bio}</p>
          </div>

          {/* Action buttons — same placement, different labels per variant */}
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
                {/* Connect — opens/creates conversation then navigates to chat */}
                <div className="flex-1">
                  <ConnectButton
                    onClick={() => connectTo(user.id)}
                    fullWidth
                    loading={connecting}
                  />
                </div>
                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`flex-1 h-11 rounded-2xl font-semibold text-sm border-2 transition-all active:scale-[0.98] ${
                    isFollowing
                      ? "text-white bg-[#6c47ff] border-[#6c47ff]"
                      : "text-[#6c47ff] bg-white border-[#6c47ff]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Work grid — real posts from DB, mock fallback in dev */}
        <div className="px-1 pt-3">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-sm font-bold text-[#1a1a1a]">My Work</h3>
            <span className="text-xs text-[#7a7570]">
              {gridLoading ? "…" : `${posts.length > 0 ? posts.length : MOCK_WORK_GRID.length} posts`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-0.5 px-0.5">
            {gridLoading ? (
              // Skeleton tiles while loading
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
              ))
            ) : posts.length > 0 ? (
              // Real posts from Supabase
              posts.map((post) => (
                <div key={post.id} className="aspect-square relative overflow-hidden">
                  {post.thumbnailUrl ? (
                    <img src={post.thumbnailUrl} alt={post.caption} className="absolute inset-0 w-full h-full object-cover" />
                  ) : post.mediaUrl && post.type === "photo" ? (
                    <img src={post.mediaUrl} alt={post.caption} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: post.thumbnailGradient }} />
                  )}
                  {post.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                        <Play size={12} fill="white" color="white" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Mock grid for dev mode / empty profile
              MOCK_WORK_GRID.map((item, i) => (
                <div key={i} className="aspect-square relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: item.gradient }} />
                  {item.hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                        <Play size={12} fill="white" color="white" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
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
