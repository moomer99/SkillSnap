"use client";
import { useState } from "react";
import { X, Loader2, CheckCircle } from "lucide-react";
import type { User } from "@/types";

type Rating = "very_happy" | "okay" | "not_satisfied";

interface FeedbackModalProps {
  skiller: Pick<User, "displayName" | "skill" | "avatarUrl" | "avatarInitial" | "avatarGradient">;
  onClose: () => void;
  onSubmit: (feedback: { rating: Rating; comment: string }) => Promise<void>;
}

const RATINGS: { key: Rating; emoji: string; label: string }[] = [
  { key: "very_happy",     emoji: "😊", label: "Yes, Very\nHappy" },
  { key: "okay",           emoji: "😐", label: "It was okay" },
  { key: "not_satisfied",  emoji: "😔", label: "Not satisfied" },
];

export default function FeedbackModal({ skiller, onClose, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState("I'm very happy with the service. I'll definitely recommend you to others.");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!rating) return;
    setLoading(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      setDone(true);
      setTimeout(onClose, 1800);
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Full-screen dim backdrop */
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#f5f5f5]">
      {/* ── Header bar (matches Figma chat header) ── */}
      <div className="bg-white border-b border-[#ebebeb] px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-[#7a7570] flex-shrink-0"
        >
          <X size={20} />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {skiller.avatarUrl ? (
            <img src={skiller.avatarUrl} alt={skiller.displayName}
              className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
              style={{ background: skiller.avatarGradient }}
            >
              {skiller.avatarInitial}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#1a1a1a] text-[15px] leading-tight">{skiller.displayName}</span>
            <span className="text-green-500">★</span>
          </div>
          {skiller.skill && (
            <p className="text-xs text-[#7a7570] mt-0.5">{skiller.skill}</p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {done ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
              <CheckCircle size={30} className="text-green-500" />
            </div>
            <p className="font-bold text-[#1a1a1a] text-lg text-center">Thank you for your feedback!</p>
            <p className="text-sm text-[#7a7570] text-center">Your review helps build trust in the community.</p>
          </div>
        ) : (
          <div className="bg-white mx-0 mt-0">
            {/* Dismiss handle (matches Figma ✕ circle) */}
            <div className="flex justify-start px-4 pt-4 pb-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#e8e4df] flex items-center justify-center text-[#7a7570]"
              >
                <X size={15} />
              </button>
            </div>

            {/* Title */}
            <div className="px-5 pb-5 text-center">
              <h2 className="font-bold text-[#1a1a1a] text-[18px] leading-tight mb-1">
                Were You Happy With the Work?
              </h2>
              <p className="text-sm text-[#7a7570]">Your feedback helps us improve the community!</p>
            </div>

            {/* Rating cards — 3 columns, matches Figma */}
            <div className="flex gap-3 px-5 mb-5">
              {RATINGS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => setRating(key)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all ${
                    rating === key
                      ? key === "not_satisfied"
                        ? "border-red-300 bg-red-50"
                        : "border-[#6c47ff] bg-[#f5f0ff]"
                      : "border-[#e8e4df] bg-white"
                  }`}
                >
                  <span className="text-3xl leading-none">{emoji}</span>
                  <span
                    className={`text-[11px] font-semibold text-center leading-tight whitespace-pre-line ${
                      rating === key
                        ? key === "not_satisfied" ? "text-red-500" : "text-[#6c47ff]"
                        : "text-[#4a4a4a]"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Note field — matches Figma "Leave a note:" label inline */}
            <div className="mx-5 mb-5 border border-[#e8e4df] rounded-2xl overflow-hidden bg-[#fafafa]">
              <div className="px-4 pt-4 pb-1">
                <span className="text-sm font-semibold text-[#1a1a1a]">Leave a note: </span>
                <span className="text-sm text-[#7a7570]">
                  {comment === "" ? "Add a comment…" : ""}
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                rows={3}
                className="w-full px-4 pb-4 text-sm text-[#4a4a4a] bg-transparent resize-none outline-none leading-relaxed"
                placeholder="Share your experience…"
              />
            </div>

            {/* Submit */}
            <div className="px-5 pb-8">
              <button
                onClick={handleSubmit}
                disabled={rating === null || loading}
                className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6c47ff, #7c5ce7)" }}
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Submitting…</>
                  : "Submit"}
              </button>
              {rating === null && (
                <p className="text-center text-xs text-[#b0aaa5] mt-2">Select an option above to continue</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
