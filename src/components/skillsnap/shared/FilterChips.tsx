"use client";
// ─────────────────────────────────────────────
// SkillSnap — Filter Chips
// Used in Discovery and potentially Search
// ─────────────────────────────────────────────

interface FilterChipsProps<T extends string> {
  chips: readonly T[];
  active: T;
  onSelect: (chip: T) => void;
}

export default function FilterChips<T extends string>({
  chips,
  active,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className={`flex-shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold transition-all ${
            active === chip
              ? "bg-[#6c47ff] text-white"
              : "bg-[#f0eeea] text-[#7a7570]"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
