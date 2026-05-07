"use client";
import { useEffect, useState } from "react";
import { Edit3, MapPin } from "lucide-react";
import type { Screen } from "@/types";
import { useAppState } from "@/state/AppState";
import { getSupabase } from "@/lib/supabase";

interface RightSidebarProps {
  onNavigate: (s: Screen) => void;
}

function useTrendingSkills() {
  const [skills, setSkills] = useState<{ skill: string; count: number }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const sb = getSupabase();
        const { data: rows } = await sb
          .from("posts")
          .select("skill")
          .not("skill", "is", null);
        if (!rows) return;
        const counts: Record<string, number> = {};
        (rows as { skill: string | null }[]).forEach((r) => {
          if (r.skill) counts[r.skill] = (counts[r.skill] ?? 0) + 1;
        });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([skill, count]) => ({ skill, count }));
        setSkills(sorted);
      } catch {
        // silently ignore — sidebar is non-critical
      }
    })();
  }, []);

  return skills;
}

const SKILL_COLORS: Record<string, string> = {
  "Barber": "#fde68a",
  "Makeup Artist": "#fbcfe8",
  "Tiler": "#d1fae5",
  "Cleaning": "#bfdbfe",
  "Fitness / PT": "#fed7aa",
  "Plumber": "#c7d2fe",
  "Electrician": "#fef08a",
  "Landscaping": "#bbf7d0",
  "Nails": "#fce7f3",
};

function skillColor(skill: string) {
  return SKILL_COLORS[skill] ?? "#ede9fe";
}

export default function RightSidebar({ onNavigate }: RightSidebarProps) {
  const { state } = useAppState();
  const { isGuest, isAuthenticated, currentUser } = state;
  const trendingSkills = useTrendingSkills();

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-5">

        {/* Guest state */}
        {(isGuest || !isAuthenticated) && (
          <div className="rounded-2xl border border-[#e8e4df] bg-[#fafafa] p-5 flex flex-col gap-3">
            <div>
              <h3 className="font-bold text-[#1a1a1a] text-base">Join SkillSnap</h3>
              <p className="text-sm text-[#7a7570] mt-1 leading-relaxed">
                Connect with skilled pros in your area
              </p>
            </div>
            <button
              onClick={() => onNavigate("auth")}
              className="w-full h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }}
            >
              Sign Up Free
            </button>
            <button
              onClick={() => onNavigate("auth")}
              className="w-full h-10 rounded-xl font-bold text-sm text-[#6c47ff] border-2 border-[#6c47ff] flex items-center justify-center hover:bg-[#f0ebff] transition-colors"
            >
              Log In
            </button>
          </div>
        )}

        {/* Logged-in state */}
        {isAuthenticated && currentUser && (
          <div className="rounded-2xl border border-[#e8e4df] bg-[#fafafa] p-4 flex flex-col gap-3">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: currentUser.avatarGradient }}
                >
                  {currentUser.avatarInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-[#1a1a1a] text-sm truncate">{currentUser.displayName}</p>
                {currentUser.skill && (
                  <span className="inline-block text-xs font-semibold text-[#6c47ff] bg-[#f0ebff] rounded-full px-2 py-0.5 mt-0.5">
                    {currentUser.skill}
                  </span>
                )}
                {currentUser.location && (
                  <p className="text-xs text-[#7a7570] flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />
                    {currentUser.location}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate("edit-profile")}
              className="w-full h-9 rounded-xl font-semibold text-sm text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-1.5 hover:bg-[#f5f3ff] hover:text-[#6c47ff] hover:border-[#c4b5fd] transition-all"
            >
              <Edit3 size={13} /> Edit Profile
            </button>
          </div>
        )}

        {/* Trending Skills */}
        {trendingSkills.length > 0 && (
          <div>
            <h3 className="font-bold text-[#1a1a1a] text-sm mb-3">Trending Skills</h3>
            <div className="flex flex-wrap gap-2">
              {trendingSkills.map(({ skill }) => (
                <span
                  key={skill}
                  className="text-xs font-semibold text-[#4a4540] rounded-full px-3 py-1.5"
                  style={{ background: skillColor(skill) }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mobile prompt + QR code */}
        <div className="rounded-2xl border border-[#e8e4df] bg-[#fafafa] p-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold text-[#1a1a1a]">📱 Best on mobile</p>
          <p className="text-xs text-[#7a7570] leading-relaxed">
            For the best experience, open SkillSnap on your phone.
          </p>
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://skillsnap.com.au"
            alt="Scan to open SkillSnap on mobile"
            width={120}
            height={120}
            className="rounded-xl border border-[#e8e4df]"
          />
        </div>

        <p className="text-[11px] text-[#b0aaa5] pb-4">
          © 2026 SkillSnap Australia · Sydney, NSW
        </p>
      </div>
    </div>
  );
}
