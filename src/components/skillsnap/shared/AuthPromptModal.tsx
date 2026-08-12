"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useAppState } from "@/state/AppState";

export default function AuthPromptModal() {
  const { state, dispatch, navigate } = useAppState();

  useEffect(() => {
    if (!state.showAuthPrompt) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dispatch({ type: "HIDE_AUTH_PROMPT" });
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state.showAuthPrompt, dispatch]);

  if (!state.showAuthPrompt || state.isAuthenticated) return null;

  function goAuth(mode: "signup" | "login") {
    dispatch({ type: "HIDE_AUTH_PROMPT" });
    navigate("auth");
    void mode;
  }

  const logo = (
    <img src="/skillsnap-icon.svg" alt="SkillSnap" width={64} height={64} className="mb-1" />
  );

  const content = (isMobile: boolean) => (
    <div className={`flex flex-col items-center text-center gap-3 ${isMobile ? "px-5 pt-2" : "px-8 pt-4"}`}>
      {logo}
      <h3 className="text-lg font-bold text-[#ffffff]">Join SkillSnap</h3>
      <p className="text-sm text-[#9d97b5] leading-relaxed max-w-[280px]">
        Sign up to connect with skilled pros near you
      </p>
      <div className="w-full flex flex-col gap-2.5 mt-3 pb-2">
        <button
          onClick={() => goAuth("signup")}
          className="w-full rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] py-4"
          style={{ background: "#6c63ff" }}
        >
          Sign Up Free
        </button>
        <button
          onClick={() => goAuth("login")}
          className="w-full rounded-2xl font-semibold text-base transition-all active:scale-[0.98] py-4 bg-[#16122a]"
          style={{ border: "1.5px solid #6c63ff", color: "#6c63ff" }}
        >
          Log In
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE — bottom sheet (hidden on md+) ── */}
      <div
        className="fixed inset-0 z-[80] flex items-end md:hidden"
        onClick={() => dispatch({ type: "HIDE_AUTH_PROMPT" })}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative w-full bg-[#16122a] pb-8 pt-2 animate-slide-up"
          style={{ borderRadius: "20px 20px 0 0" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 rounded-full bg-[#26203f] mx-auto mb-4" />
          <button
            onClick={() => dispatch({ type: "HIDE_AUTH_PROMPT" })}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1c1733] flex items-center justify-center text-[#9d97b5]"
          >
            <X size={16} />
          </button>
          {content(true)}
        </div>
      </div>

      {/* ── DESKTOP — centred modal (hidden below md) ── */}
      <div
        className="fixed inset-0 z-[80] hidden md:flex items-center justify-center"
        onClick={() => dispatch({ type: "HIDE_AUTH_PROMPT" })}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative bg-[#16122a] animate-slide-up"
          style={{ borderRadius: "16px", maxWidth: "380px", width: "100%", padding: "32px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => dispatch({ type: "HIDE_AUTH_PROMPT" })}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1c1733] flex items-center justify-center text-[#9d97b5]"
          >
            <X size={16} />
          </button>
          {content(false)}
        </div>
      </div>
    </>
  );
}
