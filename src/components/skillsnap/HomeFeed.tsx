"use client";
// ─────────────────────────────────────────────
// SkillSnap — Home feed
//
// Instagram-style card column: the document scrolls, cards are capped at 600px
// and centred, and each card keeps its media's own aspect ratio instead of
// being stretched to fill the viewport.
//
// From `sm` up the column has no horizontal padding, so a card measures the
// full 600px. Phones keep a 12px gutter so cards don't touch the screen edge.
// ─────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Heart, Bookmark, MessageCircle, Send, MapPin, Volume2, VolumeX,
  Navigation, X, Play, MoreHorizontal, Share2,
} from "lucide-react";
import type { Post, Screen } from "@/types";
import { formatLikes } from "@/mock-data/posts";
import { useFeed } from "@/hooks/useFeed";
import { useMessages } from "@/hooks/useMessages";
import { useAppState } from "@/state/AppState";
import { useLocation, distanceKm } from "@/hooks/useLocation";
import SearchBar from "./shared/SearchBar";
import UserAvatar from "./shared/UserAvatar";
import SkillSnapLogo from "./shared/SkillSnapLogo";
import ConnectButton from "./shared/ConnectButton";
import LocationPickerSheet from "./shared/LocationPickerSheet";
import { useToast } from "./shared/Toast";
import { postService } from "@/services/postService";
import { SKILL_CATEGORIES } from "@/constants/config";
import { shareProfile } from "@/lib/share";
import AppStoreButtons from "./shared/AppStoreButtons";

interface HomeFeedProps {
  onNavigate: (s: Screen) => void;
  registerScrollToTop?: (fn: () => void) => void;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

// Media narrower than 9:16 or wider than 16:9 is letterboxed rather than cropped
const MIN_ASPECT = 9 / 16;
const MAX_ASPECT = 16 / 9;
const DEFAULT_ASPECT = 4 / 5;

function clampAspect(w: number, h: number): number {
  if (!w || !h) return DEFAULT_ASPECT;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, w / h));
}

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

function computeDistance(
  viewerLat: number, viewerLng: number,
  authorLat?: number, authorLng?: number
): number | undefined {
  if (authorLat == null || authorLng == null) return undefined;
  return Math.round(distanceKm(viewerLat, viewerLng, authorLat, authorLng) * 10) / 10;
}

// ── Skeleton card shown while the first page loads ─────────────────────────
function SkeletonCard() {
  return (
    <article
      className="w-full rounded-3xl overflow-hidden animate-pulse"
      style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
    >
      <div className="w-full" style={{ aspectRatio: "4 / 5", background: "rgba(255,255,255,0.05)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="flex flex-col gap-2">
            <div className="w-32 h-3 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="w-20 h-2.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
        <div className="w-full h-11 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    </article>
  );
}

export default function HomeFeed({ onNavigate, registerScrollToTop }: HomeFeedProps) {
  const { posts, loading, loadingMore, hasMore, loadMore, likedPosts, savedPosts, toggleLike, toggleSave } = useFeed();
  const { connectTo, connecting } = useMessages();
  const { state, dispatch } = useAppState();
  const { location, status, error, radiusKm, requestGPS, setManualLocation, setRadiusKm } = useLocation();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [fullscreenPost, setFullscreenPost] = useState<Post | null>(null);
  // Commenting is app-only for now — tapping Comment explains where to do it.
  const [commentPrompt, setCommentPrompt] = useState<Post | null>(null);
  const [locationPromptDismissed, setLocationPromptDismissed] = useState(() => {
    try { return localStorage.getItem("skillsnap_loc_prompt") === "1"; } catch { return false; }
  });
  const { showToast } = useToast();

  // Infinite scroll sentinel — the document is the scroll container now
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  function requireAuth(action: () => void) {
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    if (!state.isAuthenticated && !state.isGuest) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  function requireFullAuth(action: () => void) {
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    if (!state.isAuthenticated) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  function handleProfileClick(userId: string) {
    if (userId === state.currentUser?.id) {
      onNavigate("own-profile");
    } else {
      dispatch({ type: "SET_VIEWING_USER", userId });
      onNavigate("client-profile");
    }
  }

  // Register scroll-to-top with the shell so the bottom-nav home tap can trigger it
  useEffect(() => {
    registerScrollToTop?.(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, []);

  function dismissPrompt() {
    setLocationPromptDismissed(true);
    try { localStorage.setItem("skillsnap_loc_prompt", "1"); } catch {}
  }

  const filteredPosts = useMemo(() => {
    if (!location) return posts;
    const withDist = posts.map((p) => {
      const d = computeDistance(location.lat, location.lng, p.author.lat, p.author.lng);
      return { ...p, author: { ...p.author, distanceKm: d } };
    });
    const inRadius = withDist.filter((p) => {
      const d = p.author.distanceKm;
      return d === undefined || d <= radiusKm;
    });
    return inRadius.sort((a, b) => (a.author.distanceKm ?? Infinity) - (b.author.distanceKm ?? Infinity));
  }, [posts, location, radiusKm]);

  const showLocationBanner = !location && !locationPromptDismissed;

  // Role setup banner — shown once per session until role/skill is set
  const [roleBannerDismissed, setRoleBannerDismissed] = useState(false);
  const showRoleBanner = state.isAuthenticated && !state.currentUser?.role && !state.currentUser?.skill && !roleBannerDismissed;

  return (
    <div className="flex flex-col w-full">
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-30 px-4 sm:px-0 pt-3 pb-3"
        style={{
          background: "rgba(13,10,26,0.90)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--ss-line)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* The rail already shows the logo from md up */}
          <span className="md:hidden"><SkillSnapLogo size="sm" dark /></span>
          <h1 className="hidden md:block text-[20px] font-bold text-white">Feed</h1>

          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
            style={
              location
                ? { border: "1px solid var(--ss-line)", background: "var(--ss-surface-2)" }
                : { border: "1px dashed var(--ss-purple-border)", background: "var(--ss-purple-soft)" }
            }
          >
            {location
              ? <MapPin size={12} style={{ color: "var(--ss-purple-light)" }} />
              : <Navigation size={12} style={{ color: "var(--ss-purple-light)" }} />}
            <span
              className="text-[12px] font-semibold max-w-[110px] truncate"
              style={{ color: location ? "white" : "var(--ss-purple-light)" }}
            >
              {location ? location.label : "Set location"}
            </span>
          </button>
        </div>

        <SearchBar onFocus={() => onNavigate("search")} />

        {location && (
          <div className="flex items-center gap-2 pt-2.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: "var(--ss-text-dim)" }}>
              Radius
            </span>
            <div className="flex items-center gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
                  style={
                    radiusKm === r
                      ? { background: "var(--ss-purple)", color: "white" }
                      : { background: "var(--ss-surface-2)", color: "var(--ss-text-muted)" }
                  }
                >
                  {r} km
                </button>
              ))}
            </div>
            <span className="ml-auto text-[11px] font-medium flex-shrink-0" style={{ color: "var(--ss-text-dim)" }}>
              {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </header>

      {/* ── Feed column ── */}
      <div className="flex flex-col">
        {showRoleBanner && (
          <div
            className="mx-3 mt-4 rounded-2xl flex items-center gap-3 px-4 py-3"
            style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white">Complete your profile</p>
              <p className="text-[12px] leading-snug" style={{ color: "var(--ss-text-muted)" }}>
                Let people know if you&apos;re a Client or a skilled Pro
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onNavigate("edit-profile")}
                className="text-[12px] font-bold text-white px-3 py-1.5 rounded-full"
                style={{ background: "var(--ss-purple)" }}
              >
                Set my role
              </button>
              <button onClick={() => setRoleBannerDismissed(true)} aria-label="Dismiss" className="p-1" style={{ color: "var(--ss-text-dim)" }}>✕</button>
            </div>
          </div>
        )}

        {showLocationBanner && (
          <div
            className="mx-3 mt-4 rounded-2xl flex items-center gap-3 px-4 py-3"
            style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              <Navigation size={16} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white">Find pros near you</p>
              <p className="text-[12px] leading-snug" style={{ color: "var(--ss-text-muted)" }}>
                Set your location to see skilled workers in your area
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowLocationPicker(true)}
                className="text-[12px] font-bold text-white px-3 py-1.5 rounded-full"
                style={{ background: "var(--ss-purple)" }}
              >
                Set
              </button>
              <button onClick={dismissPrompt} aria-label="Dismiss" className="p-1" style={{ color: "var(--ss-text-dim)" }}>✕</button>
            </div>
          </div>
        )}

        {loading && filteredPosts.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>

        ) : filteredPosts.length === 0 && location ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div
              className="w-16 h-16 rounded-3xl mb-4 flex items-center justify-center"
              style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)" }}
            >
              <MapPin size={28} style={{ color: "var(--ss-purple-light)" }} />
            </div>
            <p className="font-bold text-white text-base mb-2">No pros within {radiusKm} km</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ss-text-muted)" }}>
              Try expanding your radius or check back later as more skilled workers join.
            </p>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.filter(r => r > radiusKm).slice(0, 2).map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className="px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ border: "1px solid var(--ss-purple-border)", color: "var(--ss-purple-light)" }}
                >
                  Try {r} km
                </button>
              ))}
            </div>
          </div>

        ) : filteredPosts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div
              className="w-20 h-20 rounded-3xl mb-5 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
            >
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
                <circle cx="20" cy="20" r="5" fill="white" />
              </svg>
            </div>
            <h2 className="font-bold text-white text-lg mb-2 leading-tight">Welcome to SkillSnap</h2>
            <p className="text-sm leading-relaxed mb-6 max-w-[280px]" style={{ color: "var(--ss-text-muted)" }}>
              Set your location to discover skilled pros near you — or browse everyone on the platform.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <button
                onClick={() => setShowLocationPicker(true)}
                className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "var(--ss-purple)", boxShadow: "0 4px 16px rgba(108,71,255,0.35)" }}
              >
                <Navigation size={15} />
                Set My Location
              </button>
              <button
                onClick={dismissPrompt}
                className="w-full h-12 rounded-2xl font-semibold text-sm text-white"
                style={{ border: "1px solid var(--ss-line-strong)" }}
              >
                Browse Everyone
              </button>
            </div>
          </div>

        ) : (
          <>
            {filteredPosts.map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                isLiked={likedPosts.has(post.id)}
                isSaved={savedPosts.has(post.id)}
                onLike={() => requireAuth(() => toggleLike(post.id))}
                onSave={() => requireAuth(() => toggleSave(post.id))}
                onProfileClick={() => handleProfileClick(post.authorId)}
                onConnectClick={() => requireFullAuth(() => connectTo(post.authorId))}
                onShare={() => {
                  shareProfile({
                    username: post.author.username,
                    displayName: post.author.displayName,
                    text: `Check out ${post.author.displayName}'s work on SkillSnap!`,
                  }).then((result) => {
                    if (result === "copied") showToast("Profile link copied");
                  });
                }}
                onComment={() => setCommentPrompt(post)}
                onFullscreen={() => setFullscreenPost(post)}
                connecting={connecting === post.authorId}
                isOwnPost={post.authorId === state.currentUser?.id}
                isFollowed={state.followedUsers.has(post.authorId)}
                onFollow={() => requireFullAuth(() => dispatch({ type: "TOGGLE_FOLLOW", userId: post.authorId }))}
                viewerLat={location?.lat}
                viewerLng={location?.lng}
                dispatch={dispatch}
              />
            ))}

            <div ref={sentinelRef} className="w-full h-1" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <p className="text-center text-[12px] py-6" style={{ color: "var(--ss-text-dim)" }}>
                You&apos;re all caught up
              </p>
            )}
          </>
        )}
      </div>

      {showLocationPicker && (
        <LocationPickerSheet
          onClose={() => setShowLocationPicker(false)}
          onRequestGPS={requestGPS}
          onManualEntry={setManualLocation}
          status={status}
          error={error}
          currentLabel={location?.label}
        />
      )}

      {fullscreenPost && (
        <FullscreenViewer
          post={fullscreenPost}
          onClose={() => setFullscreenPost(null)}
          onProfileClick={() => { setFullscreenPost(null); handleProfileClick(fullscreenPost.authorId); }}
          onLike={() => requireAuth(() => toggleLike(fullscreenPost.id))}
          isLiked={likedPosts.has(fullscreenPost.id)}
        />
      )}

      {/* Comment sheet — reading and writing comments lives in the mobile app */}
      {commentPrompt && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setCommentPrompt(null); }}
        >
          <div
            className="w-full max-w-[520px] rounded-t-3xl sm:rounded-3xl px-6 pt-5 pb-9 sm:pb-6"
            style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: "var(--ss-line-strong)" }} />
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={18} style={{ color: "var(--ss-purple-light)" }} />
              <h3 className="font-bold text-white text-base">
                {(commentPrompt.commentsCount ?? 0) === 1
                  ? "1 comment"
                  : `${commentPrompt.commentsCount ?? 0} comments`}
              </h3>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ss-text-muted)" }}>
              Comments live in the SkillSnap app. Get it to join the conversation on{" "}
              {commentPrompt.author.displayName}&apos;s work.
            </p>
            <AppStoreButtons variant="black" />
            <button
              onClick={() => setCommentPrompt(null)}
              className="w-full mt-3 py-3 text-sm font-semibold"
              style={{ color: "var(--ss-text-muted)" }}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Full-screen viewer overlay ─────────────────────────────────────────────
function FullscreenViewer({
  post, onClose, onProfileClick, onLike, isLiked,
}: {
  post: Post;
  onClose: () => void;
  onProfileClick: () => void;
  onLike: () => void;
  isLiked: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
  }

  const { author } = post;
  const displayLocation = post.location ?? author.location;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="absolute inset-0" onClick={togglePlay}>
        {post.type === "video" && post.mediaUrl ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            className="w-full h-full object-contain"
            loop playsInline
            preload="auto"
            muted={muted}
            poster={post.thumbnailUrl}
          />
        ) : post.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <Image src={post.thumbnailUrl} alt={post.caption} fill className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="w-full h-full" style={{ background: post.thumbnailGradient }} />
        )}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 55%, rgba(0,0,0,0.8) 100%)",
        }} />
        {post.type === "video" && !playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.3)", width: 72, height: 72 }}
            >
              <Play size={28} fill="white" color="white" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 sm:pt-8 z-10">
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          <X size={20} color="white" />
        </button>
        {post.type === "video" && post.mediaUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
            aria-label={muted ? "Unmute" : "Mute"}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          >
            {muted ? <VolumeX size={18} color="white" /> : <Volume2 size={18} color="white" />}
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-10 max-w-[900px] mx-auto w-full">
        <button className="flex items-center gap-3 mb-3" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>
          <UserAvatar user={author} size="sm" showVerified ring />
          <div className="text-left">
            <span className="text-white font-bold text-[16px]">{author.displayName}</span>
            <p className="text-white/60 text-[12px]">{author.skill}</p>
          </div>
        </button>
        {post.caption ? <p className="text-white text-[14px] leading-relaxed mb-3 line-clamp-4">{post.caption}</p> : null}
        {displayLocation && (
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin size={13} className="text-white/70 flex-shrink-0" />
            <span className="text-white/70 text-[12px] font-medium">
              {author.distanceKm !== undefined ? `${author.distanceKm < 1 ? "<1" : author.distanceKm}km · ` : ""}
              {displayLocation.split(",")[0]}
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <Heart size={18} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "white"} strokeWidth={1.8} />
          <span className="text-white text-sm font-semibold">{isLiked ? "Liked" : "Like"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Feed card ──────────────────────────────────────────────────────────────
function FeedCard({
  post, isLiked, isSaved, isFollowed, onLike, onSave, onProfileClick, onConnectClick,
  onShare, onComment, onFullscreen, onFollow, connecting, isOwnPost, viewerLat, viewerLng, dispatch,
}: {
  post: Post; isLiked: boolean; isSaved: boolean; isFollowed: boolean;
  onLike: () => void; onSave: () => void; onProfileClick: () => void;
  onConnectClick: () => void; onShare: () => void; onComment: () => void; onFullscreen: () => void;
  onFollow: () => void;
  connecting: boolean; isOwnPost: boolean;
  viewerLat?: number; viewerLng?: number;
  dispatch: (a: unknown) => void;
}) {
  const { author } = post;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  // Multi-media carousel
  const mediaItems = post.mediaItems && post.mediaItems.length > 1 ? post.mediaItems : null;
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = mediaItems ? mediaItems[activeMediaIndex] : null;
  const activeMediaUrl = activeMedia ? activeMedia.url : post.mediaUrl;
  const activeMediaType = activeMedia ? activeMedia.type : post.type;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState<"caption" | "skill" | "location" | "delete" | null>(null);
  const [editCaption, setEditCaption] = useState(post.caption ?? "");
  const [editSkill, setEditSkill] = useState<string>(post.skill ?? "");
  const [editLocation, setEditLocation] = useState(post.location ?? "");

  // Size the card from the thumbnail first — video metadata can take seconds to
  // arrive over the storage proxy, and until it does the card would letterbox.
  useEffect(() => {
    const url = post.thumbnailUrl;
    if (!url) return;
    const probe = new window.Image();
    probe.onload = () => {
      setAspect((current) =>
        current === DEFAULT_ASPECT ? clampAspect(probe.naturalWidth, probe.naturalHeight) : current
      );
    };
    probe.src = url;
  }, [post.thumbnailUrl]);

  // Autoplay while the card is mostly on screen, pause when it leaves
  useEffect(() => {
    if (activeMediaType !== "video" || !activeMediaUrl) return;
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    function tryPlay() {
      video?.play().then(() => setPlaying(true)).catch(() => {});
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.addEventListener("canplay", tryPlay, { once: true });
        tryPlay();
      } else {
        video.removeEventListener("canplay", tryPlay);
        video.pause();
        setPlaying(false);
      }
    }, { threshold: 0.55 });

    observer.observe(card);
    return () => {
      observer.disconnect();
      video.removeEventListener("canplay", tryPlay);
      video.pause();
    };
  }, [activeMediaType, activeMediaUrl]);

  // Video toggles playback in place; a photo has no play state, so tapping it
  // opens the full-screen viewer instead.
  const handleMediaClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) { onFullscreen(); return; }
    if (video.paused) { video.play().catch(() => {}); } else { video.pause(); }
  }, [onFullscreen]);

  const displayLocation = post.location ?? author.location;
  const displayDistance = useMemo(() => {
    if (isOwnPost) return undefined;
    if (viewerLat == null || viewerLng == null) return undefined;
    if (author.lat == null || author.lng == null) return undefined;
    return Math.round(distanceKm(viewerLat, viewerLng, author.lat, author.lng) * 10) / 10;
  }, [isOwnPost, viewerLat, viewerLng, author.lat, author.lng]);

  const happyPct = author.happyPercent && author.happyPercent > 0 ? `${author.happyPercent}%` : null;
  const caption = post.caption ?? "";
  const captionIsLong = caption.length > 140;

  async function handleSaveEdit() {
    const patch = { caption: editCaption, skill: editSkill || null, location: editLocation };
    dispatch({ type: "UPDATE_POST", postId: post.id, patch });
    postService.updatePost(post.id, patch).catch(() => {});
    setEditMode(null);
  }

  async function handleDeleteConfirm() {
    dispatch({ type: "DELETE_POST", postId: post.id });
    postService.deletePost(post.id).catch(() => {});
    setEditMode(null);
  }

  return (
    <article
      ref={cardRef}
      className="relative w-full"
      style={{ background: "#0d0a1a", borderBottom: "1px solid #ffffff10" }}
    >
      {/* ── Author row ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onProfileClick} className="flex-shrink-0" aria-label={`View ${author.displayName}'s profile`}>
          <UserAvatar user={author} size="sm" showVerified />
        </button>

        <div className="flex-1 min-w-0">
          <button onClick={onProfileClick} className="block text-left max-w-full">
            <span className="text-[14px] font-bold text-white leading-tight truncate block">
              {author.displayName}
            </span>
          </button>

          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {author.skill && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)", color: "var(--ss-purple-light)" }}
              >
                {author.skill}
              </span>
            )}
            {displayLocation && (
              <span className="flex items-center gap-1 text-[12px] truncate" style={{ color: "var(--ss-text-dim)" }}>
                <MapPin size={11} className="flex-shrink-0" />
                {displayDistance !== undefined ? `${displayDistance < 1 ? "<1" : displayDistance}km · ` : ""}
                {displayLocation.split(",")[0]}
              </span>
            )}
            {/* The separator only earns its place when something precedes it */}
            <span className="text-[12px]" style={{ color: "var(--ss-text-dim)" }}>
              {author.skill || displayLocation ? "· " : ""}{timeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        {!isOwnPost && (
          <button
            onClick={onFollow}
            className="flex-shrink-0 text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-colors"
            style={
              isFollowed
                ? { color: "var(--ss-text-muted)", background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)" }
                : { color: "white", background: "var(--ss-purple)", border: "1px solid var(--ss-purple)" }
            }
          >
            {isFollowed ? "Following" : "Follow"}
          </button>
        )}

        {isOwnPost && (
          <button
            aria-label="Post options"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/[0.06]"
            style={{ color: "var(--ss-text-muted)" }}
            onClick={() => setMenuOpen(true)}
          >
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      {/* ── Media — full card width, own aspect ratio, nothing overlaid ── */}
      <div
        className="relative w-full bg-black cursor-pointer select-none"
        style={{ aspectRatio: String(aspect) }}
        onClick={handleMediaClick}
      >
        {activeMediaType === "video" && activeMediaUrl ? (
          <video
            ref={videoRef}
            src={activeMediaUrl}
            className="w-full h-full object-cover"
            loop playsInline
            preload="metadata"
            muted={muted}
            poster={post.thumbnailUrl}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setAspect(clampAspect(v.videoWidth, v.videoHeight));
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : activeMediaUrl ? (
          <img
            src={activeMediaUrl}
            alt={caption || `Work by ${author.displayName}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              setAspect(clampAspect(img.naturalWidth, img.naturalHeight));
            }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: post.thumbnailGradient }} />
        )}

        {/* Carousel dots — the one exception, since multi-media posts are
            otherwise indistinguishable from single ones */}
        {mediaItems && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {mediaItems.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to media ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(i); }}
                className="transition-all"
                style={{
                  width: i === activeMediaIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i === activeMediaIndex ? "white" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Action row ── */}
      <div className="flex items-center justify-between gap-3 px-2 pt-2.5">
        <div className="flex items-center gap-0.5 min-w-0">
          <ActionButton
            title="Like"
            label={formatLikes(post.likes)}
            active={isLiked}
            onClick={onLike}
            icon={<Heart size={22} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "currentColor"} strokeWidth={1.9} />}
          />
          <ActionButton
            title="Comments"
            label={formatLikes(post.commentsCount ?? 0)}
            onClick={onComment}
            icon={<MessageCircle size={22} strokeWidth={1.9} />}
          />
          <ActionButton
            title="Save"
            active={isSaved}
            onClick={onSave}
            icon={<Bookmark size={21} fill={isSaved ? "currentColor" : "none"} strokeWidth={1.9} />}
          />
          <ActionButton
            title="Recommend"
            label={(post.recommendCount ?? 0) > 0 ? formatLikes(post.recommendCount ?? 0) : undefined}
            onClick={onShare}
            icon={<Send size={21} strokeWidth={1.9} />}
          />
          {/* Sound lives here rather than over the video, which the layout keeps clear */}
          {activeMediaType === "video" && activeMediaUrl && (
            <ActionButton
              title={muted ? "Unmute" : "Mute"}
              active={!muted}
              onClick={() => setMuted((m) => !m)}
              icon={muted ? <VolumeX size={20} strokeWidth={1.9} /> : <Volume2 size={20} strokeWidth={1.9} />}
            />
          )}
        </div>

        <div className="flex-shrink-0">
          {isOwnPost ? (
            <button
              onClick={onShare}
              className="h-9 px-4 rounded-full font-semibold text-[13px] text-white flex items-center justify-center gap-1.5 transition-colors"
              style={{ border: "1px solid var(--ss-line-strong)", background: "var(--ss-surface-2)" }}
            >
              <Share2 size={15} /> Share
            </button>
          ) : (
            <ConnectButton onClick={onConnectClick} size="sm" loading={connecting} />
          )}
        </div>
      </div>

      {/* ── Caption ── */}
      {caption && (
        <div className="px-4 pt-2 pb-4">
          <p
            className={`text-[14px] leading-relaxed ${captionIsLong && !captionExpanded ? "ss-clamp-2" : ""}`}
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            {caption}
          </p>
          {captionIsLong && (
            <button
              onClick={() => setCaptionExpanded((v) => !v)}
              className="text-[13px] font-semibold mt-1"
              style={{ color: "var(--ss-text-dim)" }}
            >
              {captionExpanded ? "less" : "more"}
            </button>
          )}
        </div>
      )}
      {!caption && <div className="pb-4" />}

      {/* ── Own-post menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60" onClick={() => setMenuOpen(false)}>
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-4 pb-8 sm:pb-4"
            style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden" style={{ background: "var(--ss-line-strong)" }} />
            {[
              { label: "Edit Caption", mode: "caption" as const },
              { label: "Edit Skill", mode: "skill" as const },
              { label: "Edit Location", mode: "location" as const },
            ].map(({ label, mode }) => (
              <button
                key={mode}
                className="w-full text-left px-4 py-3.5 text-[15px] font-medium text-white rounded-xl hover:bg-white/[0.05]"
                onClick={() => { setMenuOpen(false); setEditMode(mode); }}
              >
                {label}
              </button>
            ))}
            <button
              className="w-full text-left px-4 py-3.5 text-[15px] font-medium text-red-400 rounded-xl hover:bg-red-500/10"
              onClick={() => { setMenuOpen(false); setEditMode("delete"); }}
            >
              Delete Post
            </button>
          </div>
        </div>
      )}

      {/* ── Edit modals ── */}
      {(editMode === "caption" || editMode === "skill" || editMode === "location") && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60" onClick={() => setEditMode(null)}>
          <div
            className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5"
            style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden" style={{ background: "var(--ss-line-strong)" }} />
            <p className="font-bold text-[16px] text-white mb-4">
              {editMode === "caption" ? "Edit Caption" : editMode === "skill" ? "Edit Skill" : "Edit Location"}
            </p>
            {editMode === "caption" && (
              <textarea
                className="w-full rounded-2xl px-4 py-3 text-[14px] text-white resize-none outline-none focus:border-[#6c47ff]"
                style={{ background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)" }}
                rows={4} value={editCaption} onChange={(e) => setEditCaption(e.target.value)}
              />
            )}
            {editMode === "skill" && (
              <div className="flex flex-wrap gap-2 mb-2 max-h-[240px] overflow-y-auto">
                {SKILL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEditSkill(cat)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                    style={
                      editSkill === cat
                        ? { background: "var(--ss-purple)", color: "white", border: "1px solid var(--ss-purple)" }
                        : { background: "var(--ss-surface-2)", color: "var(--ss-text-muted)", border: "1px solid var(--ss-line)" }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {editMode === "location" && (
              <input
                className="w-full rounded-2xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#6c47ff]"
                style={{ background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)" }}
                value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Sydney, NSW"
              />
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditMode(null)}
                className="flex-1 h-11 rounded-2xl text-[14px] font-semibold"
                style={{ border: "1px solid var(--ss-line)", color: "var(--ss-text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 h-11 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "var(--ss-purple)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {editMode === "delete" && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-6" onClick={() => setEditMode(null)}>
          <div
            className="rounded-3xl p-6 w-full max-w-[400px]"
            style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-bold text-[16px] text-white mb-2">Delete this post?</p>
            <p className="text-[13px] mb-6" style={{ color: "var(--ss-text-muted)" }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(null)}
                className="flex-1 h-11 rounded-2xl text-[14px] font-semibold"
                style={{ border: "1px solid var(--ss-line)", color: "var(--ss-text-muted)" }}
              >
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="flex-1 h-11 rounded-2xl text-[14px] font-semibold text-white bg-red-500">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * One action-row control. Icons are outline at rest and filled once active
 * (the fill is supplied by the caller, which knows the semantic colour).
 * `label` is omitted for the controls that have no count to show.
 */
function ActionButton({ icon, label, onClick, active, title }: {
  icon: React.ReactNode; label?: string; onClick: () => void; active?: boolean; title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center gap-1.5 px-2 py-2 rounded-xl transition-colors hover:bg-white/[0.06]"
      style={{ color: active ? "white" : "var(--ss-text-muted)" }}
    >
      {icon}
      {label !== undefined && <span className="text-[13px] font-semibold">{label}</span>}
    </button>
  );
}
