"use client";
import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { Screen } from "@/types";

interface HelpScreenProps {
  onNavigate: (s: Screen) => void;
}

const FAQS = [
  {
    q: "How do I post my work?",
    a: "Tap the + tab in the bottom nav to open the Upload screen. You can record a new video or choose one from your camera roll. Add a caption, skill tag, and location, then tap Post.",
  },
  {
    q: "How does connecting work?",
    a: "Tap the Connect button on any pro's feed card or profile. This opens a direct message thread with them so you can discuss your project. They'll be notified instantly.",
  },
  {
    q: "What is Jobs Done?",
    a: "Jobs Done is the number of completed jobs a pro has logged on their profile. It's a signal of real-world experience — the higher the number, the more work they've delivered.",
  },
  {
    q: "How do I change my location?",
    a: "On the Home Feed, tap the 'Set location' button in the top-right corner of the header. You can use GPS or type a suburb manually. Your location is only used to filter nearby pros.",
  },
  {
    q: "Is SkillSnap free?",
    a: "Yes — SkillSnap is free for both clients and skilled professionals. A Pro tier with boosted visibility is coming soon for pros who want more exposure.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Delete Account. This permanently removes your profile, posts, and all messages. If you need help, contact us first — we may be able to resolve any issues.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-[#e8e4df] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-[#f8f7f5] transition-colors"
      >
        <span className="font-semibold text-sm text-[#1a1a1a] pr-3 leading-snug">{q}</span>
        <ChevronDown
          size={16}
          className="text-[#6c47ff] flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="h-px bg-[#f0eeea] mb-3" />
          <p className="text-sm text-[#7a7570] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpScreen({ onNavigate }: HelpScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("settings")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Help & FAQ</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 flex flex-col gap-3">
        {FAQS.map((faq) => (
          <FAQItem key={faq.q} q={faq.q} a={faq.a} />
        ))}

        <div className="mt-4 rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg,#ede9fe,#f5f3ff)", border: "1.5px solid rgba(108,71,255,0.15)" }}>
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Still need help?</p>
          <p className="text-xs text-[#7a7570] mb-3">Our team usually responds within 24 hours.</p>
          <button
            onClick={() => onNavigate("contact")}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }}
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
