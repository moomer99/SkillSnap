"use client";
// ─────────────────────────────────────────────
// SkillSnap — Global Search Bar
// Integration point: wire value to searchService
// ─────────────────────────────────────────────
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onFocus?: () => void;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search skills, people, or location",
  onFocus,
  className = "",
}: SearchBarProps) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-10 cursor-text ${className}`}
      onClick={onFocus}
    >
      <Search size={15} className="text-[#b0aaa5] flex-shrink-0" />
      <span className="text-[#b0aaa5] text-sm truncate">{placeholder}</span>
    </div>
  );
}
