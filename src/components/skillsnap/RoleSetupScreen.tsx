"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { skillsByCategory } from "@/constants/skills";
import { skillEmoji } from "@/constants/skillColors";
import { CLIENT_OPTION, OTHER_OPTION } from "@/constants/skillLookup";
import { useAppState } from "@/state/AppState";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

// The two pseudo options carry their own icons; every real skill takes the
// emoji the shared vocabulary gives it.
const PSEUDO_ICONS: Record<string, string> = {
  [CLIENT_OPTION]: "🏠",
  [OTHER_OPTION]: "🛠️",
};

export default function RoleSetupScreen() {
  const { state, dispatch } = useAppState();
  const [selected, setSelected] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const resolvedSkill = selected === "Other" ? customSkill.trim() : selected;

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
    dispatch({ type: "NAVIGATE", screen: "home" });
    setSaving(false);
  }

  const canContinue = selected === "Other" ? customSkill.trim().length > 0 : !!selected;

  const renderCard = (cat: string) => {
    const isSelected = selected === cat;
    return (
      <button
        key={cat}
        onClick={() => setSelected(isSelected ? null : cat)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 20px",
          borderRadius: 16,
          border: `2px solid ${isSelected ? "#6c47ff" : "#26203f"}`,
          background: isSelected ? "var(--ss-surface-3)" : "var(--ss-surface-2)",
          cursor: "pointer",
          transition: "all 0.12s",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 26, flexShrink: 0 }}>{PSEUDO_ICONS[cat] ?? skillEmoji(cat) ?? "🛠️"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: isSelected ? "#6c47ff" : "#ffffff" }}>
            {cat === CLIENT_OPTION ? "I'm a Client" : cat === OTHER_OPTION ? "Something else…" : cat}
          </p>
          <p style={{ fontSize: 12, color: "#9d97b5", marginTop: 2 }}>
            {cat === CLIENT_OPTION ? "I hire skilled pros for jobs"
              : cat === OTHER_OPTION ? "Enter your own skill category"
              : `I offer ${cat.toLowerCase()} services`}
          </p>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${isSelected ? "#6c47ff" : "#26203f"}`,
          background: isSelected ? "#6c47ff" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isSelected && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0a1a]">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <img src="/skillsnap-icon.svg" alt="SkillSnap" width={64} height={64} className="mx-auto mb-5" />
        <h1 className="text-2xl font-black text-[#ffffff] mb-2">What brings you to SkillSnap?</h1>
        <p className="text-[#9d97b5] text-sm">Choose your role to get started</p>
      </div>

      {/* Role and skill cards — "I'm a Client" first, then the shared
          vocabulary grouped by its categories, then "Something else…" */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        <div className="flex flex-col gap-2.5">
          {renderCard(CLIENT_OPTION)}
          {skillsByCategory().map((section) => (
            <div key={section.category} className="flex flex-col gap-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6f6889] mt-3 px-1">
                {section.category}
              </p>
              {section.data.map((item) => renderCard(item.name))}
            </div>
          ))}
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6f6889] mt-3 px-1">Something else</p>
          {renderCard(OTHER_OPTION)}
        </div>

        {/* Custom skill input for Other */}
        {selected === "Other" && (
          <div className="mt-3">
            <input
              type="text"
              autoFocus
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value.slice(0, 40))}
              placeholder="e.g. Carpenter, Hairdresser, Chef…"
              className="w-full bg-[#16122a] rounded-2xl border-2 border-[#6c47ff] px-4 h-12 text-sm text-[#ffffff] placeholder-[#6f6889] outline-none"
            />
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="px-4 pb-10 pt-3 bg-[#0d0a1a]">
        <button
          onClick={handleContinue}
          disabled={!canContinue || saving}
          className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: canContinue ? "0 4px 16px rgba(108,71,255,0.30)" : "none" }}
        >
          {saving ? <><Loader2 size={20} className="animate-spin" /> Saving…</> : "Continue"}
        </button>
      </div>
    </div>
  );
}
