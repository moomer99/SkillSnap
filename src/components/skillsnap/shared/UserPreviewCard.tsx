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
      className="flex-shrink-0 bg-[#f8f7f5] rounded-2xl p-3 flex flex-col items-center gap-1.5 w-[110px] border border-[#e8e4df]"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold"
        style={{ background: pin.color }}
      >
        {pin.name.charAt(0)}
      </div>
      <p className="text-[11px] font-semibold text-[#1a1a1a] text-center leading-tight">{pin.name}</p>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: pin.color }}>
        {pin.skill}
      </span>
      <div className="flex items-center gap-0.5">
        <Star size={10} fill="#f59e0b" color="#f59e0b" />
        <span className="text-[10px] text-[#7a7570] font-medium">{pin.rating}</span>
      </div>
      <div className="w-full pt-0.5 border-t border-[#e8e4df]">
        <JobsDoneBadge count={pin.jobsDone} size="xs" />
      </div>
    </button>
  );
}
