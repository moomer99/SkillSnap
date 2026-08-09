"use client";
// ─────────────────────────────────────────────
// SkillSnap — User Preview Card
// Used in Discovery bottom tray
// ─────────────────────────────────────────────
import { Star } from "lucide-react";
import type { DiscoveryPin } from "@/types";
import JobsDoneBadge from "./JobsDoneBadge";

interface UserPreviewCardProps {
  pin: DiscoveryPin;
  onClick: () => void;
}

export default function UserPreviewCard({ pin, onClick }: UserPreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 bg-[#0d0a1a] rounded-2xl p-3 flex flex-col items-center gap-1.5 w-[110px] border border-[#26203f]"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold"
        style={{ background: pin.color }}
      >
        {pin.name.charAt(0)}
      </div>
      <p className="text-[11px] font-semibold text-[#ffffff] text-center leading-tight">{pin.name}</p>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: pin.color }}>
        {pin.skill}
      </span>
      <div className="flex items-center gap-0.5">
        <Star size={10} fill="#f59e0b" color="#f59e0b" />
        <span className="text-[10px] text-[#9d97b5] font-medium">{pin.rating}</span>
      </div>
      <div className="w-full pt-0.5 border-t border-[#26203f]">
        <JobsDoneBadge count={pin.jobsDone} size="xs" />
      </div>
    </button>
  );
}
