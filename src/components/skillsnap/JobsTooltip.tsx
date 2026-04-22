"use client";
import { useState } from "react";
import { Info, X } from "lucide-react";

interface JobsTooltipProps {
  count: number;
  dark?: boolean; // for use on dark overlays (feed card)
  size?: "sm" | "xs";
}

export default function JobsTooltip({ count, dark = false, size = "sm" }: JobsTooltipProps) {
  const [open, setOpen] = useState(false);

  const textColor = dark ? "text-white/80" : "text-[#7a7570]";
  const iconColor = dark ? "text-white/50" : "text-[#b0aaa5]";
  const fontSize = size === "xs" ? "text-[10px]" : "text-xs";

  return (
    <>
      <button
        className={`flex items-center gap-1 ${fontSize} font-medium ${textColor}`}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <svg width={size === "xs" ? 11 : 12} height={size === "xs" ? 11 : 12} viewBox="0 0 24 24" fill="none"
          stroke={dark ? "rgba(255,255,255,0.6)" : "#7a7570"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
        {count} Jobs Done
        <span className={iconColor}>
          <Info size={size === "xs" ? 10 : 11} />
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[358px] bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="#6c47ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1a1a1a]">Jobs Done</h3>
                  <p className="text-xs text-[#6c47ff] font-semibold">{count} verified jobs</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#b0aaa5] p-1">
                <X size={18} />
              </button>
            </div>

            <div className="h-px bg-[#e8e4df] mb-4" />

            <p className="text-sm text-[#4a4a4a] leading-relaxed">
              Jobs Done are confirmed after both users complete a job and verify it through chat. This reflects real work done — not ratings or reviews.
            </p>

            <div className="mt-4 flex items-center gap-2 bg-[#f8f7f5] rounded-2xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-xs text-[#7a7570]">
                Verified by both parties — no self-reporting
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full h-11 rounded-2xl font-semibold text-sm text-white mt-4 transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
