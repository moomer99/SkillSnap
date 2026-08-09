"use client";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onFocus?: () => void;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search skills, people, or location…",
  onFocus,
  className = "",
}: SearchBarProps) {
  return (
    <button
      type="button"
      onClick={onFocus}
      className={`w-full flex items-center gap-2.5 rounded-2xl px-4 h-10 cursor-text text-left transition-colors hover:bg-white/[0.08] ${className}`}
      style={{ background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)" }}
    >
      <Search size={15} className="flex-shrink-0" style={{ color: "var(--ss-purple-light)" }} />
      <span className="text-sm flex-1 truncate" style={{ color: "var(--ss-text-dim)" }}>{placeholder}</span>
    </button>
  );
}
