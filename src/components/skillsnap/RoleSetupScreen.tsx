"use client";
import { useState } from "react";
import { Loader2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { SKILL_CATEGORIES } from "@/constants/config";
import { useAppState } from "@/state/AppState";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

const COMMON_SKILLS = ["Barber", "Cleaner", "Carpenter", "Tiler", "Makeup Artist", "Driver"];

const SKILL_ICONS: Record<string, string> = {
  Client: "🏠",
  Barber: "✂️",
  Cleaner: "🧹",
  Carpenter: "🪚",
  Tiler: "🪟",
  "Makeup Artist": "💄",
  Driver: "🚗",
  Cleaning: "🧹",
  "Fitness / PT": "💪",
  Plumber: "🔧",
  Electrician: "⚡",
  Landscaping: "🌿",
  Nails: "💅",
  Other: "🛠️",
};

export default function RoleSetupScreen() {
  const { state, dispatch } = useAppState();
  const [selected, setSelected] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const resolvedSkill = selected === "Other" ? customSkill.trim() : selected;
  const canContinue = selected === "Other" ? customSkill.trim().length > 0 : !!selected;

  async function handleContinue() {
    if (!resolvedSkill) return;
    setSaving(true);

    const derivedRole: "client" | "pro" = resolvedSkill === "Client" ? "client" : "pro";
    const derivedSkill = resolvedSkill === "Client" ? null : resolvedSkill;

    try {
      if (SUPABASE_CONFIGURED && state.currentUser) {
        const { userService } = await import("@/services/userService");
        await userService.updateProfile({ skill: derivedSkill as import("@/types").SkillCategory | null, role: derivedRole });
      }
    } catch (e) {
      console.warn("[RoleSetupScreen] updateProfile failed:", e);
    }

    dispatch({
      type: "UPDATE_CURRENT_USER",
      patch: { skill: derivedSkill as import("@/types").SkillCategory | null, role: derivedRole },
    });
    dispatch({ type: "NAVIGATE", screen: "location-setup" });
    setSaving(false);
  }

  const professionalSkills = (SKILL_CATEGORIES as readonly string[]).filter((s) => s !== "Client");
  const remainingSkills = professionalSkills.filter((s) => !COMMON_SKILLS.includes(s));

  const searchResults = search.trim()
    ? professionalSkills.filter((s) => s.toLowerCase().includes(search.trim().toLowerCase()))
    : null;

  function toggle(val: string) {
    setSelected((prev) => (prev === val ? null : val));
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">

      {/* Progress indicator */}
      <div className="pt-10 px-6 pb-2 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-[#6c47ff]" />
          <div className="h-1.5 w-16 rounded-full bg-[#e8e4df]" />
        </div>
        <p className="text-xs text-[#7a7570] font-medium">Step 1 of 2</p>
      </div>

      {/* Header */}
      <div className="px-6 text-center pt-3 pb-5">
        <img src="/skillsnap-icon.svg" alt="SkillSnap" width={52} height={52} className="mx-auto mb-4" />
        <h1 className="text-2xl font-black text-[#1a1a1a] mb-1">How will you use SkillSnap?</h1>
        <p className="text-[#7a7570] text-sm">Choose your role to get started</p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">

        {/* Client card */}
        <button
          onClick={() => toggle("Client")}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl mb-4 transition-all active:scale-[0.98]"
          style={{
            border: `2px solid ${selected === "Client" ? "#6c47ff" : "#e8e4df"}`,
            background: selected === "Client" ? "#f5f3ff" : "white",
          }}
        >
          <span style={{ fontSize: 28, flexShrink: 0 }}>🏠</span>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px]" style={{ color: selected === "Client" ? "#6c47ff" : "#1a1a1a" }}>
              I'm a Client
            </p>
            <p className="text-xs text-[#7a7570] mt-0.5">Browse and hire local pros</p>
          </div>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 22, height: 22, borderRadius: "50%",
              border: `2px solid ${selected === "Client" ? "#6c47ff" : "#e8e4df"}`,
              background: selected === "Client" ? "#6c47ff" : "transparent",
            }}
          >
            {selected === "Client" && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
        </button>

        {/* Professional section */}
        <p className="text-[10px] font-bold text-[#7a7570] uppercase tracking-widest mb-3 px-1">
          I'm a Professional
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0aaa5] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills"
            className="w-full h-11 pl-10 pr-4 bg-white rounded-xl border border-[#e8e4df] text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>

        {searchResults ? (
          /* Search results */
          <div className="flex flex-wrap gap-2">
            {searchResults.length > 0 ? (
              searchResults.map((skill) => (
                <SkillChip
                  key={skill}
                  skill={skill}
                  icon={SKILL_ICONS[skill] ?? "🛠️"}
                  selected={selected === skill}
                  onToggle={() => toggle(skill)}
                />
              ))
            ) : (
              <p className="text-sm text-[#b0aaa5] py-2">No skills found</p>
            )}
          </div>
        ) : (
          <>
            {/* Common skills chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_SKILLS.map((skill) => (
                <SkillChip
                  key={skill}
                  skill={skill}
                  icon={SKILL_ICONS[skill] ?? "🛠️"}
                  selected={selected === skill}
                  onToggle={() => toggle(skill)}
                />
              ))}
            </div>

            {/* See all toggle */}
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-[#6c47ff] mb-3 active:opacity-70"
            >
              {showAll ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> See all skills</>}
            </button>

            {showAll && (
              <div className="flex flex-wrap gap-2 mb-1">
                {remainingSkills.map((skill) => (
                  <SkillChip
                    key={skill}
                    skill={skill}
                    icon={SKILL_ICONS[skill] ?? "🛠️"}
                    selected={selected === skill}
                    onToggle={() => toggle(skill)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Other custom input */}
        {selected === "Other" && (
          <div className="mt-3">
            <input
              type="text"
              autoFocus
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value.slice(0, 40))}
              placeholder="e.g. Carpenter, Hairdresser, Chef…"
              className="w-full bg-white rounded-2xl border-2 border-[#6c47ff] px-4 h-12 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
            />
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="px-4 pb-10 pt-3 bg-[#f8f7f5]">
        <button
          onClick={handleContinue}
          disabled={!canContinue || saving}
          className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: canContinue ? "linear-gradient(135deg, #6c47ff, #8b6af5)" : "#d1cec9",
            boxShadow: canContinue ? "0 4px 16px rgba(108,71,255,0.30)" : "none",
          }}
        >
          {saving ? <><Loader2 size={20} className="animate-spin" /> Saving…</> : "Continue"}
        </button>
      </div>
    </div>
  );
}

function SkillChip({
  skill, icon, selected, onToggle,
}: {
  skill: string; icon: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
      style={{
        border: `1.5px solid ${selected ? "#6c47ff" : "#e8e4df"}`,
        background: selected ? "#f5f3ff" : "white",
        color: selected ? "#6c47ff" : "#1a1a1a",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {skill}
    </button>
  );
}
