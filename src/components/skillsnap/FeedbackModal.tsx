"use client";
import { useState } from "react";
import { X, Loader2, CheckCircle } from "lucide-react";
import type { User } from "@/types";

interface FeedbackModalProps {
  skiller: Pick<User, "displayName" | "avatarInitial" | "avatarGradient">;
  onClose: () => void;
  onSubmit: (feedback: { happy: boolean; comment: string }) => Promise<void>;
}

export default function FeedbackModal({ skiller, onClose, onSubmit }: FeedbackModalProps) {
  const [happy, setHappy] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (happy === null) return;
    setLoading(true);
    try {
      await onSubmit({ happy, comment: comment.trim() });
      setDone(true);
      setTimeout(onClose, 1600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl pb-10 pt-2 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-4" />

        {done ? (
          <div className="flex flex-col items-center gap-3 py-10 px-6">
            <div className="w-14 h-14 rounded-full bg-[#dcfce7] flex items-center justify-center">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-bold text-[#1a1a1a] text-base">Thanks for your feedback!</p>
            <p className="text-sm text-[#7a7570] text-center">Your review helps build trust in the community.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 mb-5">
              <div>
                <p className="font-bold text-[#1a1a1a] text-base">Rate your experience</p>
                <p className="text-xs text-[#7a7570] mt-0.5">Job completed with <span className="font-semibold text-[#1a1a1a]">{skiller.displayName}</span></p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f0eeea] flex items-center justify-center">
                <X size={16} className="text-[#7a7570]" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ background: skiller.avatarGradient }}
              >
                {skiller.avatarInitial}
              </div>
            </div>

            {/* Happy / Not Happy */}
            <div className="px-5 mb-5">
              <p className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-3">How was the job?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setHappy(true)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    happy === true
                      ? "border-green-400 bg-green-50"
                      : "border-[#e8e4df] bg-white"
                  }`}
                >
                  <span className="text-3xl">😊</span>
                  <span className={`text-sm font-bold ${happy === true ? "text-green-600" : "text-[#7a7570]"}`}>
                    Happy
                  </span>
                </button>
                <button
                  onClick={() => setHappy(false)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    happy === false
                      ? "border-red-300 bg-red-50"
                      : "border-[#e8e4df] bg-white"
                  }`}
                >
                  <span className="text-3xl">😞</span>
                  <span className={`text-sm font-bold ${happy === false ? "text-red-500" : "text-[#7a7570]"}`}>
                    Not Happy
                  </span>
                </button>
              </div>
            </div>

            {/* Comment */}
            <div className="px-5 mb-6">
              <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">
                Leave a comment <span className="font-normal normal-case text-[#b0aaa5]">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="What did you love? Anything to improve?"
                rows={3}
                className="w-full bg-[#f8f7f5] rounded-2xl border border-[#e8e4df] p-4 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed"
              />
              <p className="text-right text-xs text-[#b0aaa5] mt-1">{comment.length} / 200</p>
            </div>

            {/* Submit */}
            <div className="px-5">
              <button
                onClick={handleSubmit}
                disabled={happy === null || loading}
                className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : "Submit Feedback"}
              </button>
              {happy === null && (
                <p className="text-center text-xs text-[#b0aaa5] mt-2">Select Happy or Not Happy to continue</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
