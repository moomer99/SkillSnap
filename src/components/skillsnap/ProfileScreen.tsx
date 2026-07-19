"use client";
// ─────────────────────────────────────────────
// SkillSnap — Profile Screen  (FIXED)
// FIX 3: Show user's actual skill tag instead of hardcoded "Client" badge
// FIX UX4: Proper empty state on both own and client profile grids
// ─────────────────────────────────────────────
import { ArrowLeft, Play, Share2, Edit3, X, MoreVertical, Trash2, ChevronDown, ChevronRight, Loader2, Bookmark, Menu, Zap, Star, TrendingUp, Video, Shield, Gift, Sparkles, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Screen, ProfileVariant, Post, SkillCategory } from "@/types";
import { MOCK_WORK_GRID } from "@/mock-data/posts";
import { SKILL_CATEGORIES } from "@/constants/config";
import { useProfile } from "@/hooks/useProfile";
import { useMessages } from "@/hooks/useMessages";
import { useAppState } from "@/state/AppState";
import UserAvatar from "./shared/UserAvatar";
import ConnectButton from "./shared/ConnectButton";
import { useToast } from "./shared/Toast";

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
  const { showToast } = useToast();

  console.log("[ProfileScreen] mounted, variant:", variant, "viewingUserId:", state.viewingUserId, "user:", user);

  function requireAuth(action: () => void) {
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    if (!state.isAuthenticated) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<"work" | "saved">("work");
  const [proExpanded, setProExpanded] = useState(false);
  const [proNotified, setProNotified] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const localOwn = isOwn ? state.localPosts.filter((p) => p.authorId === user?.id) : [];
  const mergedPosts = [
    ...localOwn.filter((lp) => !posts.some((p) => p.id === lp.id)),
    ...posts,
  ];

  const allKnownPosts = [...state.posts, ...mergedPosts];
  const savedPostsList = allKnownPosts.filter(
    (p, i, arr) => state.savedPosts.has(p.id) && arr.findIndex((x) => x.id === p.id) === i
  );

  useEffect(() => {
    if (!user) return;
    setGridLoading(true);
    if (!SUPABASE_CONFIGURED) { setPosts([]); setGridLoading(false); return; }
    import("@/services/postService").then(({ postService }) => {
      postService.getUserPosts(user.id).then((p) => { setPosts(p); setGridLoading(false); }).catch(() => { setPosts([]); setGridLoading(false); });
    });
  }, [user, state.feedVersion]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  const connections = user.followers >= 1_000_000 ? `${(user.followers / 1_000_000).toFixed(1)}M`
    : user.followers >= 1000 ? `${(user.followers / 1000).toFixed(1)}k` : String(user.followers);
  const happyDisplay = user.happyPercent == null
    ? "—"
    : user.happyPercent === 0
    ? "New"
    : `${user.happyPercent}%`;

  return (
    <div className="flex flex-col bg-[#f8f7f5] overflow-hidden" style={{ height: "100dvh" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => navigate(state.previousScreen ?? "home")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[#1a1a1a] text-sm flex-1">Profile</span>
        {isOwn ? (
          <button onClick={() => onNavigate("settings")} className="text-[#7a7570]">
            <Menu size={22} />
          </button>
        ) : (
          /* FIX 3 — Show user's actual skill instead of hardcoded "Client" */
          user.skill ? (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-[#ede9fe] text-[#5b3dd8] max-w-[110px] truncate">
              {user.skill}
            </span>
          ) : null
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">

        {/* ── Profile card ── */}
        <div className="bg-white px-4 pt-5 pb-3 border-b border-[#e8e4df]">

          {/* Centered avatar */}
          <div className="flex flex-col items-center mb-3">
            <UserAvatar user={user} size="lg" showVerified={isOwn} />
          </div>

          {/* Centered name */}
          <h2 className="text-center font-extrabold text-[18px] text-[#1a1a1a] leading-tight mb-1">
            {user.displayName}
          </h2>

          {/* Centered skill + location */}
          <p className="text-center text-[13px] text-[#7a7570] mb-2">
            {user.skill || "—"}
            {user.location ? ` • ${user.location.split(",")[0].trim()}` : ""}
          </p>

          {/* Centered bio — 2 lines with See more */}
          {(user.bio || isOwn) && (
            <div className="mb-3 px-2">
              <p
                className="text-center text-[13px] text-[#4a4a4a] leading-snug"
                style={{
                  color: "#4a4a4a",
                  display: "-webkit-box",
                  WebkitLineClamp: bioExpanded ? undefined : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: bioExpanded ? "visible" : "hidden",
                }}
              >
                {user.bio || "No bio added yet."}
              </p>
              {user.bio && user.bio.length > 80 && (
                <button
                  onClick={() => setBioExpanded(v => !v)}
                  className="w-full text-center text-[12px] font-semibold text-[#6c47ff] mt-1"
                >
                  {bioExpanded ? "Show less" : "See more"}
                </button>
              )}
            </div>
          )}

          {/* Early Bird badge centered */}
          {(user as any).isEarlyBird && (
            <div className="flex justify-center mb-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#1a1a1a" }}>
                🔥 Early Bird
              </span>
            </div>
          )}

          {/* Complete Profile prompt — own profile only, no role set */}
          {isOwn && !state.currentUser?.role && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => onNavigate("edit-profile")}
                className="text-[11px] font-bold px-3 py-1 rounded-full transition-all active:scale-95"
                style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
              >
                Complete Profile
              </button>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center mb-3 rounded-xl overflow-hidden border border-[#f0eeea]">
            <StatCell
              value={user.jobsDone >= 1000 ? `${(user.jobsDone / 1000).toFixed(0)}k` : String(user.jobsDone)}
              label={user.role === "client" ? "Hired" : "Jobs"}
              highlight
            />
            <div className="w-px self-stretch bg-[#f0eeea]" />
            <StatCell value={happyDisplay} label="Happy" />
            <div className="w-px self-stretch bg-[#f0eeea]" />
            <StatCell value={connections} label="Connections" />
            <div className="w-px self-stretch bg-[#f0eeea]" />
            <StatCell value={user.location ? user.location.split(",")[0].trim() : "—"} label="📍 Based" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isOwn ? (
              <>
                <button
                  onClick={() => onNavigate("edit-profile")}
                  className="flex-1 h-9 rounded-xl font-semibold text-[13px] text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Edit3 size={13} /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    const url = "https://skillsnap.com.au";
                    if (navigator.share) navigator.share({ title: "SkillSnap", text: `Check out ${user.displayName} on SkillSnap!`, url }).catch(() => {});
                    else navigator.clipboard?.writeText(url).catch(() => {});
                  }}
                  className="flex-1 h-9 rounded-xl font-semibold text-[13px] text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Share2 size={13} /> Share
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <ConnectButton
                    onClick={() => requireAuth(() => connectTo(user.id))}
                    fullWidth
                    loading={connecting === user.id}
                  />
                </div>
                <button
                  onClick={() => requireAuth(() => toggleFollow(user.id))}
                  className={`flex-1 h-9 rounded-xl font-semibold text-[13px] border-2 transition-all active:scale-[0.98] ${isFollowing ? "text-white bg-[#6c47ff] border-[#6c47ff]" : "text-[#6c47ff] bg-white border-[#6c47ff]"}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Profile Strength ── */}
        {isOwn && (() => {
          const completionSteps = [
            { done: !!user.avatarUrl, label: "Add a profile photo", action: () => onNavigate("edit-profile") },
            { done: !!user.bio?.trim(), label: "Add a bio", action: () => onNavigate("edit-profile") },
            { done: !!user.skill || !!user.role, label: "Set your skill or role", action: () => onNavigate("edit-profile") },
            { done: !!user.location?.trim(), label: "Add your location", action: () => onNavigate("edit-profile") },
            { done: (user.postCount ?? 0) > 0, label: "Upload your first showcase", action: () => onNavigate("upload") },
          ];
          const completedCount = completionSteps.filter(s => s.done).length;
          const completionPct = Math.round((completedCount / completionSteps.length) * 100);
          const incompleteSteps = completionSteps.filter(s => !s.done);
          if (completionPct === 100) return null;
          return (
            <div className="bg-white px-4 py-3 border-b border-[#e8e4df]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-[#1a1a1a]">Profile Strength</span>
                <span className="text-[12px] font-bold text-[#6c47ff]">{completionPct}% Complete</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#f0eeea] mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%`, background: "linear-gradient(90deg, #6c47ff, #a78bfa)" }}
                />
              </div>
              <div className="flex flex-col">
                {incompleteSteps.slice(0, 3).map((step, i) => (
                  <button
                    key={i}
                    onClick={step.action}
                    className="flex items-center gap-2.5 py-1.5 text-left active:opacity-70 transition-opacity"
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-[#d1cec9] flex-shrink-0" />
                    <span className="flex-1 text-[12px] text-[#7a7570]">{step.label}</span>
                    <ChevronRight size={14} className="text-[#b0aaa5] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Tabs ── */}
        <div className="pt-0">
          {isOwn && (
            <div className="flex border-b border-[#e8e4df] bg-white">
              {(["work", "saved"] as const).map((tab) => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeTab === tab ? "text-[#6c47ff] border-b-2 border-[#6c47ff]" : "text-[#7a7570]"}`}>
                  {tab === "work" ? (state.currentUser?.role === "client" ? "Hired History" : "My Works") : "Saved"}
                  {tab === "work" && (() => { const count = gridLoading ? null : (mergedPosts.length || (!SUPABASE_CONFIGURED ? MOCK_WORK_GRID.length : 0)); return count ? <span className="text-[10px] font-bold bg-[#6c47ff] text-white px-1.5 py-0.5 rounded-full leading-none">{count}</span> : null; })()}
                  {tab === "saved" && savedPostsList.length > 0 && <span className="text-[10px] font-bold bg-[#6c47ff] text-white px-1.5 py-0.5 rounded-full leading-none">{savedPostsList.length}</span>}
                </button>
              ))}
            </div>
          )}


          {(isOwn ? activeTab === "work" : true) && (
            <div className="grid grid-cols-3 gap-0.5 pt-0.5">
              {gridLoading ? (
                Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square bg-gray-200 animate-pulse" />)
              ) : mergedPosts.length > 0 ? (
                mergedPosts.map((post) => <GridTile key={post.id} post={post} onClick={() => setViewingPost(post)} />)
              ) : !SUPABASE_CONFIGURED ? (
                MOCK_WORK_GRID.map((item, i) => (
                  <div key={i} className="aspect-square relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: item.gradient }} />
                    {item.hasVideo && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center"><Play size={12} fill="white" color="white" /></div></div>}
                  </div>
                ))
              ) : (
                /* FIX UX4 — Empty grid state for BOTH own and client profiles */
                <div className="col-span-3 py-14 flex flex-col items-center gap-3 text-center px-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)" }}>
                    {!isOwn ? (
                      <svg width="26" height="22" viewBox="0 0 24 20" fill="none" stroke="#6c47ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="8" height="8" rx="2" fill="#6c47ff" opacity="0.7"/>
                        <rect x="13" y="3" width="8" height="8" rx="2" fill="#6c47ff" opacity="0.4"/>
                        <rect x="3" y="13" width="8" height="8" rx="2" fill="#6c47ff" opacity="0.4"/>
                        <rect x="13" y="13" width="8" height="8" rx="2" fill="#6c47ff" opacity="0.2"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#1a1a1a]">No posts yet</p>
                  <p className="text-xs text-[#b0aaa5] leading-relaxed">
                    {isOwn
                      ? (state.currentUser?.role === "client" || !state.currentUser?.role)
                        ? "Set up your Pro profile to showcase your work and start getting hired"
                        : "Upload your first job to showcase your skill and start getting clients"
                      : "This person is new to SkillSnap and hasn't posted yet. Connect directly to ask about their work."}
                  </p>
                  <button
                    onClick={() => {
                      if (!isOwn) { requireAuth(() => connectTo(user.id)); return; }
                      if (state.currentUser?.role === "client" || !state.currentUser?.role) {
                        onNavigate("edit-profile");
                      } else {
                        onNavigate("upload");
                      }
                    }}
                    className="mt-1 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
                  >
                    {isOwn
                      ? (state.currentUser?.role === "client" || !state.currentUser?.role)
                        ? "Set Up Pro Profile — Free"
                        : "Upload First Post"
                      : "Connect with them"}
                  </button>
                </div>
              )}
            </div>
          )}


          {activeTab === "work" && isOwn && state.currentUser?.role === "client" && (
            <div className="py-14 flex flex-col items-center gap-3 text-center px-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)" }}>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-sm font-bold text-[#1a1a1a]">No hired history yet</p>
              <p className="text-xs text-[#b0aaa5] leading-relaxed">Jobs you confirm via SkillSnap will appear here</p>
            </div>
          )}

          {activeTab === "saved" && isOwn && (
            <div className="grid grid-cols-3 gap-0.5 px-0.5 pt-0.5">
              {savedPostsList.length > 0 ? (
                savedPostsList.map((post) => <GridTile key={post.id} post={post} onClick={() => setViewingPost(post)} />)
              ) : (
                <div className="col-span-3 py-12 flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f0eeea] flex items-center justify-center mb-1"><Bookmark size={20} className="text-[#b0aaa5]" /></div>
                  <p className="text-sm font-semibold text-[#7a7570]">Nothing saved yet</p>
                  <p className="text-xs text-[#b0aaa5]">Tap the bookmark on any post to save it here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewingPost && (
        <MediaViewer post={viewingPost} isOwn={isOwn} onClose={() => setViewingPost(null)}
          onDelete={async (postId) => {
            dispatch({ type: "DELETE_POST", postId });
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setViewingPost(null);
            if (SUPABASE_CONFIGURED && state.currentUser) {
              try { const { postService } = await import("@/services/postService"); await postService.deletePost(postId); } catch (e) { console.warn("Delete post from DB failed:", e); }
            }
          }}
          onUpdate={(updated) => { setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p)); setViewingPost(updated); }}
        />
      )}
    </div>
  );
}

function GridTile({ post, onClick }: { post: Post; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = !imgErr ? (post.thumbnailUrl || (post.type === "photo" ? post.mediaUrl : undefined)) : undefined;
  return (
    <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={onClick}>
      <div className="absolute inset-0" style={{ background: post.thumbnailGradient }} />
      {imgSrc && <img src={imgSrc} alt={post.caption} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgErr(true)} />}
      {post.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center"><Play size={12} fill="white" color="white" /></div>
        </div>
      )}
    </div>
  );
}

function MediaViewer({ post, isOwn, onClose, onDelete, onUpdate }: { post: Post; isOwn: boolean; onClose: () => void; onDelete: (postId: string) => Promise<void>; onUpdate: (post: Post) => void; }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [skill, setSkill] = useState<SkillCategory | "">(post.skill ?? "");
  const [location, setLocation] = useState(post.location ?? "");
  const [saving, setSaving] = useState(false);

  function handlePlayToggle() {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
  }
  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onUpdate({ ...post, caption, skill: skill as SkillCategory, location });
    setSaving(false); setShowEdit(false);
  }
  async function handleDelete() { setSaving(true); await onDelete(post.id); }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <button className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white" onClick={onClose}><X size={18} /></button>
        {isOwn && <button className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white" onClick={() => setShowMenu(true)}><MoreVertical size={18} /></button>}
      </div>
      <div className="flex-1 flex items-center justify-center" onClick={() => { if (post.type === "video") handlePlayToggle(); }}>
        {post.type === "video" && post.mediaUrl ? (
          <>
            <video ref={videoRef} src={post.mediaUrl} className="w-full h-full object-contain" loop playsInline preload="metadata" poster={post.thumbnailUrl} onEnded={() => setPlaying(false)} />
            {!playing && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", border: "2px solid rgba(255,255,255,0.3)" }}><svg width="20" height="24" viewBox="0 0 20 24" fill="white"><path d="M1 1l18 11-18 11V1z" /></svg></div></div>}
          </>
        ) : post.mediaUrl ? <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-contain" />
        : post.thumbnailUrl ? <img src={post.thumbnailUrl} alt={post.caption} className="w-full h-full object-contain" />
        : <div className="w-full h-full" style={{ background: post.thumbnailGradient }} />}
      </div>
      {post.caption && (
        <div className="px-4 py-3 bg-black/70">
          <p className="text-white text-sm leading-snug">{post.caption}</p>
          {post.skill && <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-[#c4b5fd]" style={{ background: "rgba(108,71,255,0.25)" }}>{post.skill}</span>}
          {post.location && <span className="inline-block ml-2 mt-1 text-xs text-white/60">· {post.location}</span>}
        </div>
      )}
      {showMenu && (
        <div className="fixed inset-0 z-60 flex items-end" onClick={() => setShowMenu(false)}>
          <div className="w-full bg-[#1a1a1a] rounded-t-2xl pb-8 pt-2" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <button className="w-full flex items-center gap-4 px-5 py-4 text-white text-sm font-medium active:bg-white/5" onClick={() => { setShowMenu(false); setShowEdit(true); }}><Edit3 size={18} className="text-[#a78bfa]" /> Edit Post</button>
            <div className="h-px bg-white/10 mx-5" />
            <button className="w-full flex items-center gap-4 px-5 py-4 text-red-400 text-sm font-medium active:bg-white/5" onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}><Trash2 size={18} /> Delete Post</button>
            <div className="h-px bg-white/10 mx-5" />
            <button className="w-full flex items-center gap-4 px-5 py-4 text-white/60 text-sm font-medium active:bg-white/5" onClick={() => setShowMenu(false)}><X size={18} /> Cancel</button>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-end" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full bg-[#1a1a1a] rounded-t-2xl pb-8 pt-2" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="px-5 pb-4"><p className="text-white font-bold text-base mb-1">Delete this post?</p><p className="text-white/50 text-sm">This action can't be undone.</p></div>
            <button disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 py-4 text-red-400 text-sm font-bold active:bg-white/5 disabled:opacity-50" onClick={handleDelete}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{saving ? "Deleting..." : "Delete Post"}</button>
            <div className="h-px bg-white/10 mx-5" />
            <button className="w-full px-5 py-4 text-white/60 text-sm font-medium active:bg-white/5" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showEdit && (
        <div className="fixed inset-0 z-60 flex items-end" onClick={() => setShowEdit(false)}>
          <div className="w-full bg-[#1a1a1a] rounded-t-2xl pb-8 pt-2 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />
            <div className="flex items-center justify-between px-5 mb-5"><p className="text-white font-bold text-base">Edit Post</p><button onClick={() => setShowEdit(false)} className="text-white/50"><X size={18} /></button></div>
            <div className="px-5 mb-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 150))} rows={3} className="w-full bg-white/10 rounded-xl border border-white/10 p-3.5 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed" placeholder="Describe your work..." />
              <p className="text-right text-xs text-white/30 mt-1">{caption.length} / 150</p>
            </div>
            <div className="px-5 mb-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Skill Category</label>
              <div className="bg-white/10 rounded-xl border border-white/10 px-4 h-12 flex items-center justify-between relative">
                <select value={skill} onChange={(e) => setSkill(e.target.value as SkillCategory | "")} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"><option value="">Select skill...</option>{SKILL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select>
                <span className={`text-sm ${skill ? "text-white" : "text-white/30"}`}>{skill || "Select skill..."}</span>
                <ChevronDown size={16} className="text-white/30" />
              </div>
              <div className="flex flex-wrap gap-2 mt-2.5">{SKILL_CATEGORIES.slice(0, 6).map((cat) => <button key={cat} onClick={() => setSkill(skill === cat ? "" : cat)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${skill === cat ? "bg-[#6c47ff] text-white border-[#6c47ff]" : "bg-white/10 text-white/60 border-white/10"}`}>{cat}</button>)}</div>
            </div>
            <div className="px-5 mb-6">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Sydney CBD" className="w-full bg-white/10 rounded-xl border border-white/10 px-4 h-12 text-sm text-white placeholder-white/30 outline-none focus:border-[#6c47ff] transition-colors" />
            </div>
            <div className="px-5">
              <button onClick={handleSave} disabled={saving} className="w-full h-13 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 py-3.5" style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}>
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-1">
      <span className={`font-extrabold text-[15px] leading-tight ${highlight ? "text-[#6c47ff]" : "text-[#1a1a1a]"}`}>{value}</span>
      <span className="text-[10px] text-[#7a7570] font-medium mt-0.5 text-center">{label}</span>
    </div>
  );
}

const PRO_FEATURES = [
  { icon: <Video size={18} />, color: "#a78bfa", bg: "rgba(167,139,250,0.12)", title: "In-App Video Editing", desc: "Smart filters, branding overlays, and pro-grade edits directly in the app." },
  { icon: <TrendingUp size={18} />, color: "#34d399", bg: "rgba(52,211,153,0.12)", title: "Local Discovery Boosts", desc: "Get pinned to the top of local search results so more clients find you first." },
  { icon: <Shield size={18} />, color: "#60a5fa", bg: "rgba(96,165,250,0.12)", title: "Verified Pro Badge", desc: "Stand out with a blue verified checkmark that builds instant trust." },
  { icon: <Star size={18} />, color: "#fbbf24", bg: "rgba(251,191,36,0.12)", title: "Brand Partnerships", desc: "Connect with brands and earn from sponsored collaborations. (Later stage)", later: true },
];

function ProTab({ notified, onNotify, expanded, onToggleExpand }: { notified: boolean; onNotify: () => void; expanded: boolean; onToggleExpand: () => void; }) {
  const visibleFeatures = expanded ? PRO_FEATURES : PRO_FEATURES.slice(0, 2);
  return (
    <div className="bg-[#f8f7f5] pb-6">
      <div className="relative px-5 pt-8 pb-8 overflow-hidden flex flex-col items-center text-center" style={{ background: "linear-gradient(160deg, #0d0a1a 0%, #1a0f3c 100%)" }}>
        <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="relative mb-4">
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #6c47ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(108,71,255,0.5)" }}><Zap size={30} fill="white" color="white" /></div>
          <div style={{ position: "absolute", top: -5, right: -5, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0d0a1a" }}><Star size={9} fill="white" color="white" /></div>
        </div>
        <h2 className="text-white font-extrabold text-2xl mb-2 tracking-tight">Go <span style={{ background: "linear-gradient(90deg, #a78bfa, #6c47ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pro</span></h2>
        <p className="text-white/50 text-xs leading-relaxed max-w-xs">Supercharge your profile, land more clients, and grow your trade business with professional tools built for skilled workers.</p>
        <div className="flex items-center gap-2 mt-4"><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6c47ff", display: "inline-block" }} /><span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: 1.2 }}>LAUNCHING SOON</span></div>
      </div>
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0f3c, #2d1b69)", border: "1px solid rgba(167,139,250,0.2)" }}>
        <div className="px-4 py-4 flex items-start gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 13, background: "linear-gradient(135deg, #f59e0b, #fbbf24)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Gift size={19} color="white" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1"><span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>Free 3-Month Pro Access</span><span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 99, background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>EXCLUSIVE</span></div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>Be one of the <span style={{ color: "#fbbf24", fontWeight: 700 }}>first 100</span> to sign up and upload a video — get <span style={{ color: "#fbbf24", fontWeight: 700 }}>3 months free</span>.</p>
            <div className="mt-2.5">
              <div className="flex justify-between mb-1"><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Spots claimed</span><span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24" }}>47 / 100</span></div>
              <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}><div style={{ height: "100%", width: "47%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: 99 }} /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3"><Sparkles size={12} color="#a78bfa" /><span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.2 }}>What's included</span></div>
        <div className="flex flex-col gap-2.5">
          {visibleFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl p-3.5" style={{ background: "#fff", border: "1px solid #e8e4df" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: f.color }}>{f.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-[#1a1a1a]">{f.title}</span>{f.later && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(251,191,36,0.1)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>Later</span>}</div>
                <p className="text-xs text-[#7a7570] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onToggleExpand} className="flex items-center justify-center gap-1.5 w-full py-3 text-[#6c47ff] text-xs font-bold active:opacity-70 transition-opacity">{expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> See all features</>}</button>
      </div>
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e8e4df" }}>
        <div className="px-4 py-4">
          <p className="text-[10px] font-bold text-[#b0aaa5] uppercase tracking-wider mb-3">Pricing</p>
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-xl border border-[#e8e4df] p-3 text-center"><p className="text-[10px] text-[#b0aaa5] mb-1.5">Monthly</p><p className="text-xl font-extrabold text-[#1a1a1a]">$9<span className="text-xs font-medium text-[#b0aaa5]">/mo</span></p><p className="text-[10px] text-[#b0aaa5] mt-1">Cancel anytime</p></div>
            <div className="flex-1 rounded-xl p-3 text-center relative" style={{ background: "linear-gradient(135deg, rgba(108,71,255,0.08), rgba(167,139,250,0.05))", border: "1.5px solid #6c47ff" }}>
              <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #6c47ff, #a78bfa)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>BEST VALUE</div>
              <p className="text-[10px] text-[#7a7570] mb-1.5">Yearly</p><p className="text-xl font-extrabold text-[#1a1a1a]">$7<span className="text-xs font-medium text-[#b0aaa5]">/mo</span></p><p className="text-[10px] text-[#6c47ff] font-semibold mt-1">Save $24/year</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-4">
        {notified ? (
          <div className="flex flex-col items-center gap-2 py-4"><div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center"><span className="text-xl">✓</span></div><p className="font-bold text-[#1a1a1a] text-sm">You're on the list!</p><p className="text-xs text-[#7a7570] text-center">We'll notify you when Pro launches. Early bird window secured.</p></div>
        ) : (
          <button onClick={onNotify} className="w-full h-13 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform py-3.5" style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 20px rgba(108,71,255,0.3)" }}><Zap size={17} fill="white" color="white" /> Notify Me at Launch</button>
        )}
      </div>
    </div>
  );
}
