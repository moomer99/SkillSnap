"use client";
// ─────────────────────────────────────────────
// Public profile — work grid + lightbox
// Thumbnails render server-side; tapping one opens an inline viewer so visitors
// can actually watch the work without installing the app first.
// ─────────────────────────────────────────────
import { useState } from "react";
import { Play, X, Heart, MessageCircle } from "lucide-react";
import type { PublicPost } from "@/lib/supabase/public";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function WorkGrid({ posts }: { posts: PublicPost[] }) {
  const [active, setActive] = useState<PublicPost | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setActive(post)}
            className="relative aspect-square overflow-hidden rounded-md group"
            style={{ background: post.thumbnail_gradient ?? "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
            aria-label={post.caption || "View work"}
          >
            {post.thumbnail_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.thumbnail_url}
                alt={post.caption || "Work sample"}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {post.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Play size={14} fill="white" color="white" />
                </span>
              </span>
            )}

            {(post.likes_count ?? 0) > 0 && (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold text-white drop-shadow">
                <Heart size={11} fill="white" stroke="none" />
                {formatCount(post.likes_count ?? 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm p-4"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>

          <div
            className="w-full max-w-[420px] max-h-[80vh] rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: active.thumbnail_gradient ?? "#000" }}
            onClick={(e) => e.stopPropagation()}
          >
            {active.type === "video" && active.media_url ? (
              <video
                src={active.media_url}
                poster={active.thumbnail_url ?? undefined}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[80vh] object-contain"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={active.media_url ?? active.thumbnail_url ?? ""}
                alt={active.caption || "Work sample"}
                className="w-full max-h-[80vh] object-contain"
              />
            )}
          </div>

          <div className="w-full max-w-[420px] mt-3 text-white" onClick={(e) => e.stopPropagation()}>
            {active.caption && <p className="text-sm leading-relaxed mb-2">{active.caption}</p>}
            <div className="flex items-center gap-4 text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="flex items-center gap-1.5">
                <Heart size={13} /> {formatCount(active.likes_count ?? 0)}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={13} /> {formatCount(active.comments_count ?? 0)}
              </span>
              {active.location && <span>📍 {active.location}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
