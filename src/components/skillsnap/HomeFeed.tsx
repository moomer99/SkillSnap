"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { Heart, Share2, Bookmark, MapPin, Volume2, VolumeX, Navigation, X, Play } from "lucide-react";
import type { Post } from "@/types";
import type { Screen } from "@/types";
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

interface HomeFeedProps {
  onNavigate: (s: Screen) => void;
}

const HEADER_H_NO_LOC = 88;
const HEADER_H_WITH_LOC = 120;
const RADIUS_OPTIONS = [5, 10, 15, 25];

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

// ── Skeleton card shown while first page loads ─────────────────────────────
function SkeletonCard({ headerH }: { headerH: number }) {
  return (
    <div
      className="w-full bg-[#1a1a2e] flex-shrink-0 mb-2 animate-pulse"
      style={{ height: `calc(100dvh - ${headerH}px - 8px)` }}
    >
      {/* Bottom info skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex flex-col gap-1.5">
            <div className="w-28 h-3 rounded bg-white/10" />
            <div className="w-16 h-2.5 rounded bg-white/10" />
          </div>
        </div>
        <div className="w-full h-12 rounded-2xl bg-white/10" />
        <div className="w-full h-12 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export default function HomeFeed({ onNavigate }: HomeFeedProps) {
  const { posts, loading, loadingMore, hasMore, loadMore, likedPosts, savedPosts, toggleLike, toggleSave } = useFeed();
  const { connectTo, connecting } = useMessages();
  const { state, dispatch } = useAppState();
  const { location, status, error, radiusKm, requestGPS, setManualLocation, setRadiusKm } = useLocation();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [fullscreenPost, setFullscreenPost] = useState<Post | null>(null);
  const [locationPromptDismissed, setLocationPromptDismissed] = useState(() => {
    try { return localStorage.getItem("skillsnap_loc_prompt") === "1"; } catch { return false; }
  });

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // Restore video src when returning to the tab after being away
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        document.querySelectorAll("video").forEach((video) => {
          if (!video.src || video.src === window.location.href) {
            const dataSrc = video.getAttribute("data-src");
            if (dataSrc) {
              video.src = dataSrc;
              video.load();
            }
          }
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  function requireAuth(action: () => void) {
    if (state.isGuest) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
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
  const headerH = location ? HEADER_H_WITH_LOC : HEADER_H_NO_LOC;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-3 pb-0 w-full">
        <div className="flex items-center justify-between mb-2.5">
          <SkillSnapLogo size="lg" />
          {location ? (
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e8e4df] bg-[#f8f7f5] active:bg-[#f0eeea] transition-colors"
            >
              <MapPin size={11} className="text-[#6c47ff]" />
              <span className="text-[11px] font-semibold text-[#1a1a1a] max-w-[80px] truncate">{location.label}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-[#6c47ff]/40 bg-[#ede9fe]/30 active:bg-[#ede9fe]/60 transition-colors"
            >
              <Navigation size={11} className="text-[#6c47ff]" />
              <span className="text-[11px] font-bold text-[#6c47ff]">Set location</span>
            </button>
          )}
        </div>
        <SearchBar onFocus={() => onNavigate("search")} />

        {location && (
          <div className="flex items-center gap-2 pb-2.5 pt-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-[#b0aaa5] uppercase tracking-wider flex-shrink-0">Radius</span>
            <div className="flex items-center gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    radiusKm === r
                      ? "bg-[#6c47ff] text-white shadow-sm"
                      : "bg-[#f0eeea] text-[#7a7570] active:bg-[#e8e4df]"
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
            <span className="ml-auto text-[10px] text-[#b0aaa5] font-medium flex-shrink-0">
              {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </header>

      {/* Feed scroll container */}
      <div className="overflow-y-auto no-scrollbar" style={{ height: `calc(100dvh - ${headerH}px)` }}>
        {showLocationBanner && (
          <div
            className="mx-3 mt-3 mb-1 rounded-2xl overflow-hidden flex items-center gap-3 px-4 py-3"
            style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)", border: "1.5px solid rgba(108,71,255,0.18)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}>
              <Navigation size={16} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#1a1a1a]">Find pros near you</p>
              <p className="text-[11px] text-[#7a7570] leading-snug">Set your location to see skilled workers in your area</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowLocationPicker(true)}
                className="text-[11px] font-bold text-white px-3 py-1.5 rounded-full"
                style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}>
                Set
              </button>
              <button onClick={dismissPrompt} className="text-[#b0aaa5] p-1">✕</button>
            </div>
          </div>
        )}

        {/* Skeleton — shown immediately on first load before posts arrive */}
        {loading && filteredPosts.length === 0 ? (
          <div className="relative" style={{ height: `calc(100dvh - ${headerH}px - 8px)` }}>
            <SkeletonCard headerH={headerH} />
          </div>

        ) : filteredPosts.length === 0 && location ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-3xl mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)" }}>
              <MapPin size={28} className="text-[#6c47ff]" />
            </div>
            <p className="font-bold text-[#1a1a1a] text-base mb-2">No pros within {radiusKm} km</p>
            <p className="text-[#7a7570] text-sm leading-relaxed mb-5">
              Try expanding your radius or check back later as more skilled workers join.
            </p>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.filter(r => r > radiusKm).slice(0, 2).map((r) => (
                <button key={r} onClick={() => setRadiusKm(r)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-[#6c47ff] text-[#6c47ff] active:bg-[#ede9fe]">
                  Try {r} km
                </button>
              ))}
            </div>
          </div>

        ) : filteredPosts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-3xl mb-5 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}>
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
                <circle cx="20" cy="20" r="5" fill="white" />
                <circle cx="20" cy="10" r="2" fill="white" opacity="0.8" />
                <circle cx="28.7" cy="25" r="2" fill="white" opacity="0.8" />
                <circle cx="11.3" cy="25" r="2" fill="white" opacity="0.8" />
              </svg>
            </div>
            <h2 className="font-bold text-[#1a1a1a] text-lg mb-2 leading-tight">Welcome to SkillSnap</h2>
            <p className="text-[#7a7570] text-sm leading-relaxed mb-6 max-w-[260px]">
              Set your location to discover skilled pros near you — or browse everyone on the platform.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <button
                onClick={() => setShowLocationPicker(true)}
                className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 16px rgba(108,71,255,0.30)" }}
              >
                <Navigation size={15} />
                Set My Location
              </button>
              <button
                onClick={dismissPrompt}
                className="w-full h-12 rounded-2xl font-semibold text-sm text-[#6c47ff] border-2 border-[#ede9fe] bg-white"
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
                onConnectClick={() => requireAuth(() => connectTo(post.authorId))}
                onShare={() => {
                  if (navigator.share) {
                    navigator.share({ title: "SkillSnap", text: "Check out this work on SkillSnap!", url: "https://skillsnap.com.au" }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText("https://skillsnap.com.au").catch(() => {});
                  }
                }}
                onFullscreen={() => setFullscreenPost(post)}
                connecting={connecting === post.authorId}
                isOwnPost={post.authorId === state.currentUser?.id}
                headerH={headerH}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="w-full h-1" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
              </div>
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
          isOwnPost={fullscreenPost.authorId === state.currentUser?.id}
        />
      )}
    </div>
  );
}

// ── Full-screen viewer overlay ─────────────────────────────────────────────
function FullscreenViewer({
  post, onClose, onProfileClick, onLike, isLiked, isOwnPost,
}: {
  post: Post;
  onClose: () => void;
  onProfileClick: () => void;
  onLike: () => void;
  isLiked: boolean;
  isOwnPost: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
  }

  const { author } = post;
  const displayLocation = post.location ?? author.location;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ touchAction: "none" }}>
      <div className="absolute inset-0" onClick={togglePlay}>
        {post.type === "video" && post.mediaUrl ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            data-src={post.mediaUrl}
            className="w-full h-full object-contain"
            loop playsInline
            preload="metadata"
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
            <div className="w-18 h-18 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.3)", width: 72, height: 72 }}>
              <Play size={28} fill="white" color="white" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
          <X size={20} color="white" />
        </button>
        {post.type === "video" && post.mediaUrl && (
          <button onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
            {muted ? <VolumeX size={18} color="white" /> : <Volume2 size={18} color="white" />}
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-10">
        <button className="flex items-center gap-3 mb-3" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>
          <UserAvatar user={author} size="sm" showVerified ring />
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-[16px]">{author.displayName}</span>
              {author.isVerified && (
                <span className="w-[17px] h-[17px] rounded-full bg-[#6c47ff] flex items-center justify-center">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-white/60 text-[12px]">{author.skill}</p>
          </div>
        </button>
        {post.caption ? <p className="text-white text-[14px] leading-relaxed mb-3 line-clamp-4">{post.caption}</p> : null}
        {displayLocation && (
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin size={13} className="text-white/70 flex-shrink-0" />
            <span className="text-white/70 text-[12px] font-medium">
              {author.distanceKm !== undefined ? `${author.distanceKm} km · ` : ""}
              {displayLocation.split(",")[0]}
            </span>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <Heart size={18} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "white"} strokeWidth={1.8} />
          <span className="text-white text-sm font-semibold">{isLiked ? "Liked" : "Like"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Feed card ──────────────────────────────────────────────────────
function FeedCard({
  post, isLiked, isSaved, onLike, onSave, onProfileClick, onConnectClick, onShare, onFullscreen, connecting, isOwnPost, headerH,
}: {
  post: Post; isLiked: boolean; isSaved: boolean;
  onLike: () => void; onSave: () => void; onProfileClick: () => void;
  onConnectClick: () => void; onShare: () => void; onFullscreen: () => void;
  connecting: boolean; isOwnPost: boolean; headerH: number;
}) {
  const { author } = post;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post.type !== "video" || !post.mediaUrl) return;
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    function tryPlay() {
      if (!video) return;
      video.play().then(() => setPlaying(true)).catch(() => {});
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Restore src if it was cleared when the card left the viewport
        if (!video!.src || video!.src === window.location.href) {
          video!.src = post.mediaUrl!;
        }
        video!.load();
        video!.addEventListener("canplay", tryPlay, { once: true });
      } else {
        video!.removeEventListener("canplay", tryPlay);
        video!.pause();
        // Free memory by unloading the video when it's off-screen
        video!.src = "";
        video!.load();
        setPlaying(false);
      }
    }, { threshold: 0.6 });

    observer.observe(card);
    return () => {
      observer.disconnect();
      video.removeEventListener("canplay", tryPlay);
      video.pause();
    };
  }, [post.type, post.mediaUrl]);

  const handleMediaTap = useCallback(() => { onFullscreen(); }, [onFullscreen]);
  const displayLocation = post.location ?? author.location;
  const happyPct = author.happyPercent !== undefined && author.happyPercent !== null
    ? `${author.happyPercent}%` : "—";
  const showPlayOverlay = post.type === "video" && !playing;

  return (
    <div
      ref={cardRef}
      className="relative w-full overflow-hidden bg-gray-900 flex-shrink-0 mb-2"
      style={{ height: `calc(100dvh - ${headerH}px - 8px)` }}
    >
      {/* Media */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleMediaTap}>
        {post.type === "video" && post.mediaUrl ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            data-src={post.mediaUrl}
            className="w-full h-full object-cover"
            loop playsInline
            preload="metadata"
            muted={muted}
            poster={post.thumbnailUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : post.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={post.thumbnailUrl}
              alt={post.caption}
              fill
              className="object-cover"
              sizes="430px"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-full" style={{ background: post.thumbnailGradient }} />
        )}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 22%, transparent 50%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.88) 100%)",
        }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
        <span className="text-white/70 text-[12px] font-medium">{timeAgo(post.createdAt)}</span>
        {post.type === "video" && post.mediaUrl && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white active:bg-black/60 transition-colors"
            onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="text-[11px] font-semibold">{muted ? "Tap for sound" : "Mute"}</span>
          </button>
        )}
      </div>

      {/* Play overlay */}
      {showPlayOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", border: "2px solid rgba(255,255,255,0.28)" }}>
            <svg width="20" height="24" viewBox="0 0 20 24" fill="white"><path d="M1 1l18 11-18 11V1z" /></svg>
          </div>
        </div>
      )}

      {/* Right actions */}
      <div className="absolute right-3 z-10 flex flex-col items-center gap-5" style={{ bottom: 220 }}>
        <RightAction
          icon={<Heart size={26} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "white"} strokeWidth={1.8} />}
          label={formatLikes(post.likes)} onClick={onLike}
        />
        <RightAction icon={<Share2 size={24} stroke="white" strokeWidth={1.8} />} label="Share" onClick={onShare} />
        <RightAction
          icon={<Bookmark size={24} fill={isSaved ? "white" : "none"} stroke="white" strokeWidth={1.8} />}
          label={isSaved ? "Saved" : "Save"} onClick={onSave} active={isSaved}
        />
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5">
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

        {post.caption ? <p className="text-white/90 text-[13px] leading-snug mb-3 line-clamp-2">{post.caption}</p> : null}

        <div className="flex items-stretch mb-3 rounded-2xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(10px)" }}>
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
          <StatCell value={happyPct} label="Happy" green={happyPct !== "—" && happyPct !== "0%"} icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="9" cy="9.5" r="1.2" fill="#000" opacity="0.45"/>
              <circle cx="15" cy="9.5" r="1.2" fill="#000" opacity="0.45"/>
              <path d="M7.5 13.5c1 2 8 2 9 0" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.45"/>
            </svg>
          } />
          {displayLocation && (
            <>
              <VSep />
              <LocationCell distanceKm={author.distanceKm} location={displayLocation} onPress={onProfileClick} />
            </>
          )}
        </div>

        {!isOwnPost && <ConnectButton onClick={onConnectClick} fullWidth loading={connecting} />}
      </div>
    </div>
  );
}

function StatCell({ value, label, icon, green }: { value: string; label: string; icon: React.ReactNode; green?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1">
      <span className="leading-none mb-0.5">{icon}</span>
      <span className={`text-[14px] font-extrabold leading-tight tracking-tight ${green ? "text-[#4ade80]" : "text-white"}`}>{value}</span>
      <span className="text-[10px] text-white/55 font-medium leading-tight text-center">{label}</span>
    </div>
  );
}

function LocationCell({ distanceKm: d, location, onPress }: { distanceKm?: number; location?: string; onPress: () => void }) {
  const suburb = location ? location.split(",")[0].trim() : "";
  const truncated = suburb.length > 12 ? suburb.slice(0, 12) + "…" : suburb;
  return (
    <button className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 active:opacity-70 transition-opacity"
      onClick={(e) => { e.stopPropagation(); onPress(); }}>
      <span className="leading-none mb-0.5">
        <svg width="11" height="14" viewBox="0 0 11 14" fill="white">
          <path d="M5.5 0A5.5 5.5 0 000 5.5C0 9.625 5.5 14 5.5 14S11 9.625 11 5.5A5.5 5.5 0 005.5 0zm0 7.5a2 2 0 110-4 2 2 0 010 4z"/>
        </svg>
      </span>
      <span className="text-[14px] font-extrabold leading-tight tracking-tight text-white">
        {d !== undefined ? `${d < 1 ? "<1" : d}km` : truncated || "—"}
      </span>
      <span className="text-[10px] text-white/55 font-medium leading-tight text-center">
        {d !== undefined ? truncated || "Nearby" : "Location"}
      </span>
    </button>
  );
}

function VSep() { return <div className="w-px bg-white/15 self-stretch my-2" />; }

function RightAction({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform" onClick={onClick}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: active ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(255,255,255,0.16)" }}>
        {icon}
      </div>
      <span className="text-white text-[11px] font-semibold">{label}</span>
    </button>
  );
}
