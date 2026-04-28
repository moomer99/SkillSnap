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
      className={`w-full flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-10 cursor-text text-left active:bg-[#e8e4df] transition-colors ${className}`}
    >
      <Search size={15} className="text-[#6c47ff] flex-shrink-0" />
      <span className="text-[#b0aaa5] text-sm flex-1 truncate">{placeholder}</span>
    </button>
  );
}
