"use client";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "auth" | "chat" | "client-profile";

interface AuthScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function AuthScreen({ onNavigate }: AuthScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero visual area */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #ede9fe 0%, #f8f7f5 50%, #fff 100%)" }}>

        {/* Floating skill bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Bubble text="Barber" top="12%" left="8%" rotate="-8deg" />
          <Bubble text="Tiler" top="20%" left="72%" rotate="6deg" />
          <Bubble text="Makeup Artist" top="38%" left="4%" rotate="-4deg" />
          <Bubble text="Fitness" top="55%" left="68%" rotate="10deg" />
          <Bubble text="Cleaning" top="68%" left="12%" rotate="-6deg" />
          <Bubble text="Plumber" top="75%" left="58%" rotate="3deg" />
        </div>

        {/* Logo + brand */}
        <div className="relative z-10 flex flex-col items-center text-center px-8 mt-12">
          {/* Logo mark */}
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
            style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
              <circle cx="20" cy="20" r="5" fill="white" />
              <circle cx="20" cy="10" r="2" fill="white" opacity="0.8" />
              <circle cx="28.7" cy="25" r="2" fill="white" opacity="0.8" />
              <circle cx="11.3" cy="25" r="2" fill="white" opacity="0.8" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight mb-2">SkillSnap</h1>

          <p className="text-xl font-semibold text-[#6c47ff] mt-2 mb-1">Watch. Trust. Connect.</p>
          <p className="text-sm text-[#7a7570] leading-relaxed max-w-[260px]">
            Discover real skills near you
          </p>
        </div>

        {/* Showcase preview cards */}
        <div className="relative z-10 mt-10 flex gap-3 px-6">
          <MiniCard
            gradient="linear-gradient(135deg, #667eea, #764ba2)"
            skill="Barber"
            name="Marcus T."
          />
          <MiniCard
            gradient="linear-gradient(135deg, #f093fb, #f5576c)"
            skill="Makeup"
            name="Priya K."
            offset
          />
          <MiniCard
            gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
            skill="Tiler"
            name="Jake R."
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pt-8 pb-12 flex flex-col gap-3 bg-white">
        <button
          onClick={() => onNavigate("home")}
          className="w-full h-14 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          Sign up
        </button>
        <button
          onClick={() => onNavigate("home")}
          className="w-full h-14 rounded-2xl font-semibold text-base text-[#6c47ff] border border-[#e8e4df] bg-white transition-all active:scale-[0.98]"
        >
          Log in
        </button>
        <p className="text-center text-xs text-[#b0aaa5] mt-1">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}

function Bubble({ text, top, left, rotate }: { text: string; top: string; left: string; rotate: string }) {
  return (
    <div
      className="absolute text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm border border-[#e8e4df] text-[#6c47ff] whitespace-nowrap"
      style={{ top, left, transform: `rotate(${rotate})`, opacity: 0.85 }}
    >
      {text}
    </div>
  );
}

function MiniCard({ gradient, skill, name, offset }: { gradient: string; skill: string; name: string; offset?: boolean }) {
  return (
    <div
      className={`relative w-[100px] h-[130px] rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ${offset ? "-mt-4" : ""}`}
      style={{ background: gradient }}
    >
      {/* Play icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="white">
            <path d="M1 1l12 7-12 7V1z" />
          </svg>
        </div>
      </div>
      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
        <p className="text-white text-[10px] font-bold leading-tight">{skill}</p>
        <p className="text-white/80 text-[9px] leading-tight">{name}</p>
      </div>
    </div>
  );
}
