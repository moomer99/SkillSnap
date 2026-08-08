"use client";
import { ArrowLeft } from "lucide-react";
import type { Screen } from "@/types";
import { SUPPORT_EMAIL } from "@/constants/contact";

interface AboutScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function AboutScreen({ onNavigate }: AboutScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("settings")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">About SkillSnap</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-10 flex flex-col items-center">

        {/* Logo */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-lg"
          style={{ background: "linear-gradient(135deg,#6c47ff,#a78bfa)" }}
        >
          <img src="/logo-icon.svg" alt="SkillSnap" className="w-12 h-12" />
        </div>

        <h2 className="font-extrabold text-[#1a1a1a] text-2xl mb-1 tracking-tight">SkillSnap</h2>
        <p className="text-xs font-semibold text-[#b0aaa5] mb-8 uppercase tracking-widest">Version 1.0</p>

        {/* Mission */}
        <div className="w-full bg-white rounded-2xl border border-[#e8e4df] p-5 mb-4">
          <h3 className="font-bold text-sm text-[#1a1a1a] mb-2">Our Mission</h3>
          <p className="text-sm text-[#7a7570] leading-relaxed">
            Empowering skilled Australians to showcase their work and connect with local clients through video. No more guessing — watch the work, then decide.
          </p>
        </div>

        {/* Story */}
        <div className="w-full bg-white rounded-2xl border border-[#e8e4df] p-5 mb-4">
          <h3 className="font-bold text-sm text-[#1a1a1a] mb-2">The Story</h3>
          <p className="text-sm text-[#7a7570] leading-relaxed">
            SkillSnap was built in Sydney for tradies, barbers, makeup artists, and every skilled professional who deserves to be seen. We believe real video proof beats any star rating.
          </p>
        </div>

        {/* Links */}
        <div className="w-full bg-white rounded-2xl border border-[#e8e4df] overflow-hidden mb-8">
          <a href="https://skillsnap.com.au" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 active:bg-[#f8f7f5] transition-colors">
            <span className="text-sm font-semibold text-[#1a1a1a]">Website</span>
            <span className="text-xs text-[#6c47ff] font-semibold">skillsnap.com.au ↗</span>
          </a>
          <div className="h-px bg-[#f0eeea]" />
          <button
            onClick={() => onNavigate("contact")}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-[#f8f7f5] transition-colors text-left"
          >
            <span className="text-sm font-semibold text-[#1a1a1a]">Contact</span>
            <span className="text-xs text-[#6c47ff] font-semibold">Get in touch ↗</span>
          </button>
          <div className="h-px bg-[#f0eeea]" />
          <a href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center justify-between px-4 py-4 active:bg-[#f8f7f5] transition-colors">
            <span className="text-sm font-semibold text-[#1a1a1a]">Email</span>
            <span className="text-xs text-[#6c47ff] font-semibold">{SUPPORT_EMAIL} ↗</span>
          </a>
        </div>

        <p className="text-xs text-[#b0aaa5] text-center">© 2025 SkillSnap Pty Ltd · Sydney, Australia</p>
      </div>
    </div>
  );
}
