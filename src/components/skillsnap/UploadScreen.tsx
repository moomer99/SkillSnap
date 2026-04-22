"use client";
import { Video, Image, Instagram, MapPin, ChevronDown, ArrowLeft } from "lucide-react";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "auth" | "chat" | "client-profile";

interface UploadScreenProps {
  onNavigate: (s: Screen) => void;
}

const categories = ["Barber", "Tiler", "Makeup Artist", "Cleaning", "Fitness / PT", "Plumber", "Electrician", "Landscaping", "Nails", "Other"];

export default function UploadScreen({ onNavigate }: UploadScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("home")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Showcase Your Work</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-28 px-4 pt-5 flex flex-col gap-5">

        {/* Upload type buttons */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-3 block">Choose content</label>
          <div className="flex flex-col gap-3">
            <UploadButton
              icon={<Video size={22} className="text-[#6c47ff]" />}
              title="Upload Video"
              subtitle="MP4, MOV up to 60 seconds"
              active
            />
            <UploadButton
              icon={<Image size={22} className="text-[#6c47ff]" />}
              title="Upload Photo"
              subtitle="JPG, PNG up to 10MB"
            />
            <UploadButton
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="25%" stopColor="#e6683c" />
                      <stop offset="50%" stopColor="#dc2743" />
                      <stop offset="75%" stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)" strokeWidth="2" fill="none" />
                  <circle cx="12" cy="12" r="4" stroke="url(#igGrad)" strokeWidth="2" fill="none" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="url(#igGrad)" />
                </svg>
              }
              title="Import from Social Media"
              subtitle="Instagram, TikTok, Facebook"
            />
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">Caption</label>
          <div className="bg-white rounded-2xl border border-[#e8e4df] p-4 min-h-[100px]">
            <p className="text-[#b0aaa5] text-sm leading-relaxed">Describe your work — what skill, what service, what result...</p>
          </div>
          <p className="text-right text-xs text-[#b0aaa5] mt-1">0 / 150</p>
        </div>

        {/* Skill category */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">Skill Category</label>
          <div className="bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 flex items-center justify-between">
            <span className="text-[#b0aaa5] text-sm">Select your skill...</span>
            <ChevronDown size={16} className="text-[#b0aaa5]" />
          </div>
          {/* Category pills preview */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  cat === "Barber"
                    ? "bg-[#6c47ff] text-white border-[#6c47ff]"
                    : "bg-white text-[#7a7570] border-[#e8e4df]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">Location</label>
          <div className="bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 flex items-center gap-2.5">
            <MapPin size={16} className="text-[#6c47ff]" />
            <span className="text-[#1a1a1a] text-sm font-medium">Liverpool, NSW</span>
            <span className="ml-auto text-[10px] text-[#6c47ff] font-semibold bg-[#ede9fe] px-2 py-0.5 rounded-full">Auto</span>
          </div>
        </div>

        {/* Preview area */}
        <div className="bg-white rounded-2xl border border-dashed border-[#c4b5fd] p-6 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center">
            <Video size={26} className="text-[#6c47ff]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">No content selected</p>
            <p className="text-xs text-[#7a7570]">Choose a video or photo above</p>
          </div>
        </div>
      </div>

      {/* Bottom post button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 pb-6 pt-3 bg-white/95 backdrop-blur-sm border-t border-[#e8e4df]">
        <button
          className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function UploadButton({
  icon,
  title,
  subtitle,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
        active
          ? "border-[#c4b5fd] bg-[#faf8ff]"
          : "border-[#e8e4df] bg-white"
      }`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: active ? "#ede9fe" : "#f0eeea" }}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? "text-[#6c47ff]" : "text-[#1a1a1a]"}`}>{title}</p>
        <p className="text-xs text-[#7a7570] mt-0.5">{subtitle}</p>
      </div>
      {active && (
        <div className="ml-auto w-5 h-5 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="white">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}
