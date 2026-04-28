"use client";
// ─────────────────────────────────────────────
// SkillSnap — Profile Screen
// variant="own"    → My Profile (current user)
// variant="client" → Client Profile (public view)
// Data: userService.getUser(id) via useProfile hook
// ─────────────────────────────────────────────
import { MapPin, ArrowLeft, Play, Share2, Edit3, X, MoreVertical, Trash2, ChevronDown, Loader2, Bookmark, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Screen, ProfileVariant, Post, SkillCategory } from "@/types";
import { MOCK_WORK_GRID } from "@/mock-data/posts";
import { SKILL_CATEGORIES } from "@/constants/config";
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
  const { state, navigate, dispatch } = useAppState();

  function requireAuth(action: () => void) {
    if (state.isGuest) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }
  const [posts, setPosts] = useState<Post[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<"work" | "saved">("work");

  // Merge locally-created posts (demo mode) so they always appear on own profile
  const localOwn = isOwn
    ? state.localPosts.filter((p) => p.authorId === user?.id)
    : [];
  const mergedPosts = [
    ...localOwn.filter((lp) => !posts.some((p) => p.id === lp.id)),
    ...posts,
  ];

  // Saved posts — resolved from global savedPosts set + all known posts
  const allKnownPosts = [...state.posts, ...mergedPosts];
  const savedPostsList = allKnownPosts.filter(
    (p, i, arr) => state.savedPosts.has(p.id) && arr.findIndex((x) => x.id === p.id) === i
  );

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

  const connections = user.followers >= 1_000_000
    ? `${(user.followers / 1_000_000).toFixed(1)}M`
    : user.followers >= 1000
    ? `${(user.followers / 1000).toFixed(1)}k`
    : String(user.followers);

  const happyDisplay = user.happyPercent !== undefined && user.happyPercent !== null
    ? `${user.happyPercent}%`
    : "—";

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
        {isOwn ? (
          <button
            onClick={() => onNavigate("settings")}
            className="w-9 h-9 flex items-center justify-center text-[#7a7570] active:text-[#6c47ff] transition-colors"
          >
            <Settings size={20} />
          </button>
        ) : (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#d1fae5] text-[#065f46]"
          >
            Client
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Profile card — identical layout for both variants */}
        <div className="bg-white px-5 pt-6 pb-5 border-b border-[#e8e4df]">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <UserAvatar user={user} size="lg" showVerified={isOwn} />

            {/* Stats: Jobs Done · Happy · Connections */}
            <div className="flex-1 flex items-center justify-around pt-1 pb-1">
              <Stat
                value={user.jobsDone >= 1000 ? `${(user.jobsDone / 1000).toFixed(0)}k` : String(user.jobsDone)}
                label="Jobs Done"
                highlight
              />
              <div className="w-px h-8 bg-[#e8e4df]" />
              <Stat value={happyDisplay} label="😊 Happy" />
              <div className="w-px h-8 bg-[#e8e4df]" />
              <Stat value={connections} label="Connections" />
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
                <button
                  onClick={() => onNavigate("edit-profile")}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Edit3 size={14} />
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    const text = `Check out ${user.displayName} on SkillSnap!`;
                    if (navigator.share) navigator.share({ title: "SkillSnap", text }).catch(() => {});
                    else navigator.clipboard?.writeText(text).catch(() => {});
                  }}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </>
            ) : (
              <>
                {/* Connect — opens/creates conversation then navigates to chat */}
                <div className="flex-1">
                  <ConnectButton
                    onClick={() => requireAuth(() => connectTo(user.id))}
                    fullWidth
                    loading={connecting}
                  />
                </div>
                <button
                  onClick={() => requireAuth(() => toggleFollow(user.id))}
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

        {/* Grid section */}
        <div className="pt-0">

          {isOwn ? (
            /* ── Own profile: My Works | Saved tabs ── */
            <div className="flex border-b border-[#e8e4df] bg-white">
              <button
                onClick={() => setActiveTab("work")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "work"
                    ? "text-[#6c47ff] border-b-2 border-[#6c47ff]"
                    : "text-[#7a7570]"
                }`}
              >
                My Works
                {(() => {
                  const count = gridLoading ? null : (mergedPosts.length || (!SUPABASE_CONFIGURED ? MOCK_WORK_GRID.length : 0));
                  if (!count) return null;
                  return (
                    <span className="text-[10px] font-bold bg-[#6c47ff] text-white px-1.5 py-0.5 rounded-full leading-none">
                      {count}
                    </span>
                  );
                })()}
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "saved"
                    ? "text-[#6c47ff] border-b-2 border-[#6c47ff]"
                    : "text-[#7a7570]"
                }`}
              >
                Saved
                {savedPostsList.length > 0 && (
                  <span className="text-[10px] font-bold bg-[#6c47ff] text-white px-1.5 py-0.5 rounded-full leading-none">
                    {savedPostsList.length}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* ── Client profile: plain Works header with count ── */
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8e4df] bg-white">
              <h3 className="text-sm font-bold text-[#1a1a1a]">Works</h3>
              {(() => {
                const count = gridLoading ? null : (mergedPosts.length || (!SUPABASE_CONFIGURED ? MOCK_WORK_GRID.length : 0));
                if (!count) return null;
                return (
                  <span className="text-[10px] font-bold bg-[#6c47ff] text-white px-1.5 py-0.5 rounded-full leading-none">
                    {count}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Grid — shown for "work" tab on own, always on client */}
          {(activeTab === "work" || !isOwn) && (
            <div className="grid grid-cols-3 gap-0.5 pt-0.5">
                {gridLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
                  ))
                ) : mergedPosts.length > 0 ? (
                  mergedPosts.map((post) => (
                    <GridTile key={post.id} post={post} onClick={() => setViewingPost(post)} />
                  ))
                ) : !SUPABASE_CONFIGURED ? (
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
                ) : (
                  <div className="col-span-3 py-10 flex flex-col items-center gap-2 text-center">
                    <p className="text-sm font-semibold text-[#7a7570]">No posts yet</p>
                    <p className="text-xs text-[#b0aaa5]">Upload your first job to showcase your skill</p>
                  </div>
                )}
              </div>
          )}

          {/* Saved grid — own profile only */}
          {activeTab === "saved" && isOwn && (
            <div className="grid grid-cols-3 gap-0.5 px-0.5 pt-0.5">
              {savedPostsList.length > 0 ? (
                savedPostsList.map((post) => (
                  <GridTile key={post.id} post={post} onClick={() => setViewingPost(post)} />
                ))
              ) : (
                <div className="col-span-3 py-12 flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f0eeea] flex items-center justify-center mb-1">
                    <Bookmark size={20} className="text-[#b0aaa5]" />
                  </div>
                  <p className="text-sm font-semibold text-[#7a7570]">Nothing saved yet</p>
                  <p className="text-xs text-[#b0aaa5]">Tap the bookmark on any post to save it here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen media viewer */}
      {viewingPost && (
        <MediaViewer
          post={viewingPost}
          isOwn={isOwn}
          onClose={() => setViewingPost(null)}
          onDelete={async (postId) => {
            // Remove from global feed state immediately
            dispatch({ type: "DELETE_POST", postId });
            // Remove from local profile list
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setViewingPost(null);
            // Persist to Supabase if authenticated
            if (SUPABASE_CONFIGURED && state.currentUser && !state.isGuest) {
              try {
                const { postService } = await import("@/services/postService");
                await postService.deletePost(postId);
              } catch (e) {
                console.warn("Delete post from DB failed:", e);
              }
            }
          }}
          onUpdate={(updated) => {
            setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            setViewingPost(updated);
          }}
        />
      )}

    </div>
  );
}

function FeaturedThumb({
  post, mockItem, onClick,
}: {
  post?: Post;
  mockItem?: { gradient: string; hasVideo: boolean };
  onClick: (p: Post) => void;
}) {
  if (!post && !mockItem) return null;
  return (
    <div
      className="w-14 h-14 relative overflow-hidden flex-shrink-0 self-center mr-3 rounded-xl border-2 border-[#6c47ff]/30 cursor-pointer"
      onClick={() => post && onClick(post)}
    >
      {post?.thumbnailUrl ? (
        <img src={post.thumbnailUrl} className="w-full h-full object-cover" alt="" />
      ) : (
        <div
          className="w-full h-full"
          style={{ background: post?.thumbnailGradient ?? mockItem?.gradient ?? "#ccc" }}
        />
      )}
      {(post?.type === "video" || mockItem?.hasVideo) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-white/35 flex items-center justify-center">
            <Play size={8} fill="white" color="white" />
          </div>
        </div>
      )}
    </div>
  );
}

function GridTile({ post, onClick }: { post: Post; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = !imgErr ? (post.thumbnailUrl || (post.type === "photo" ? post.mediaUrl : undefined)) : undefined;

  return (
    <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={onClick}>
      {/* Always render gradient as base layer */}
      <div className="absolute inset-0" style={{ background: post.thumbnailGradient }} />
      {imgSrc && (
        <img
          src={imgSrc}
          alt={post.caption}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      )}
      {post.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
            <Play size={12} fill="white" color="white" />
          </div>
        </div>
      )}
    </div>
  );
}

function MediaViewer({
  post, isOwn, onClose, onDelete, onUpdate,
}: {
  post: Post;
  isOwn: boolean;
  onClose: () => void;
  onDelete: (postId: string) => Promise<void>;
  onUpdate: (post: Post) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state — pre-filled with current post values
  const [caption, setCaption] = useState(post.caption);
  const [skill, setSkill] = useState<SkillCategory | "">(post.skill ?? "");
  const [location, setLocation] = useState(post.location ?? "");
  const [saving, setSaving] = useState(false);

  function handlePlayToggle() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }

  async function handleSave() {
    setSaving(true);
    // In production: call postService.updatePost(post.id, { caption, skill, location })
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    onUpdate({ ...post, caption, skill: skill as SkillCategory, location });
    setSaving(false);
    setShowEdit(false);
  }

  async function handleDelete() {
    setSaving(true);
    await onDelete(post.id);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <button
          className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        {isOwn && (
          <button
            className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
            onClick={() => setShowMenu(true)}
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>

      {/* Media */}
      <div
        className="flex-1 flex items-center justify-center"
        onClick={() => { if (post.type === "video") handlePlayToggle(); }}
      >
        {post.type === "video" && post.mediaUrl ? (
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              className="w-full h-full object-contain"
              loop
              playsInline
              preload="metadata"
              poster={post.thumbnailUrl}
              onEnded={() => setPlaying(false)}
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", border: "2px solid rgba(255,255,255,0.3)" }}
                >
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
                    <path d="M1 1l18 11-18 11V1z" />
                  </svg>
                </div>
              </div>
            )}
          </>
        ) : post.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: post.thumbnailGradient }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", border: "2px solid rgba(255,255,255,0.3)" }}>
              <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
                <path d="M1 1l18 11-18 11V1z" />
              </svg>
            </div>
          </div>
        ) : post.mediaUrl ? (
          <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-contain" />
        ) : post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={post.caption} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full" style={{ background: post.thumbnailGradient }} />
        )}
      </div>

      {/* Caption bar */}
      {post.caption && (
        <div className="px-4 py-3 bg-black/70">
          <p className="text-white text-sm leading-snug">{post.caption}</p>
          {post.skill && (
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-[#c4b5fd]"
              style={{ background: "rgba(108,71,255,0.25)" }}>
              {post.skill}
            </span>
          )}
          {post.location && (
            <span className="inline-block ml-2 mt-1 text-xs text-white/60">· {post.location}</span>
          )}
        </div>
      )}

      {/* Action menu overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-60 flex items-end" onClick={() => setShowMenu(false)}>
          <div
            className="w-full bg-[#1a1a1a] rounded-t-2xl pb-8 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <button
              className="w-full flex items-center gap-4 px-5 py-4 text-white text-sm font-medium active:bg-white/5"
              onClick={() => { setShowMenu(false); setShowEdit(true); }}
            >
              <Edit3 size={18} className="text-[#a78bfa]" />
              Edit Post
            </button>
            <div className="h-px bg-white/10 mx-5" />
            <button
              className="w-full flex items-center gap-4 px-5 py-4 text-red-400 text-sm font-medium active:bg-white/5"
              onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
            >
              <Trash2 size={18} />
              Delete Post
            </button>
            <div className="h-px bg-white/10 mx-5" />
            <button
              className="w-full flex items-center gap-4 px-5 py-4 text-white/60 text-sm font-medium active:bg-white/5"
              onClick={() => setShowMenu(false)}
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-end" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="w-full bg-[#1a1a1a] rounded-t-2xl pb-8 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="px-5 pb-4">
              <p className="text-white font-bold text-base mb-1">Delete this post?</p>
              <p className="text-white/50 text-sm">This action can't be undone.</p>
            </div>
            <button
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 text-red-400 text-sm font-bold active:bg-white/5 disabled:opacity-50"
              onClick={handleDelete}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {saving ? "Deleting..." : "Delete Post"}
            </button>
            <div className="h-px bg-white/10 mx-5" />
            <button
              className="w-full px-5 py-4 text-white/60 text-sm font-medium active:bg-white/5"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit post sheet */}
      {showEdit && (
        <div className="fixed inset-0 z-60 flex items-end" onClick={() => setShowEdit(false)}>
          <div
            className="w-full bg-[#1a1a1a] rounded-t-2xl pb-8 pt-2 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />
            <div className="flex items-center justify-between px-5 mb-5">
              <p className="text-white font-bold text-base">Edit Post</p>
              <button onClick={() => setShowEdit(false)} className="text-white/50">
                <X size={18} />
              </button>
            </div>

            {/* Caption */}
            <div className="px-5 mb-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 150))}
                rows={3}
                className="w-full bg-white/10 rounded-xl border border-white/10 p-3.5 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed"
                placeholder="Describe your work..."
              />
              <p className="text-right text-xs text-white/30 mt-1">{caption.length} / 150</p>
            </div>

            {/* Skill */}
            <div className="px-5 mb-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Skill Category</label>
              <div className="bg-white/10 rounded-xl border border-white/10 px-4 h-12 flex items-center justify-between relative">
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value as SkillCategory | "")}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                >
                  <option value="">Select skill...</option>
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className={`text-sm ${skill ? "text-white" : "text-white/30"}`}>{skill || "Select skill..."}</span>
                <ChevronDown size={16} className="text-white/30" />
              </div>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {SKILL_CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSkill(skill === cat ? "" : cat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      skill === cat
                        ? "bg-[#6c47ff] text-white border-[#6c47ff]"
                        : "bg-white/10 text-white/60 border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="px-5 mb-6">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sydney CBD"
                className="w-full bg-white/10 rounded-xl border border-white/10 px-4 h-12 text-sm text-white placeholder-white/30 outline-none focus:border-[#6c47ff] transition-colors"
              />
            </div>

            {/* Save */}
            <div className="px-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-13 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 py-3.5"
                style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
              >
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className={`font-extrabold text-[15px] leading-tight tracking-tight ${highlight ? "text-[#6c47ff]" : "text-[#1a1a1a]"}`}>
        {value}
      </span>
      <span className="text-[10px] text-[#7a7570] font-medium leading-tight text-center">{label}</span>
    </div>
  );
}
