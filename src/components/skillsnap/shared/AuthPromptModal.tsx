"use client";
import { X } from "lucide-react";
import { useAppState } from "@/state/AppState";

export default function AuthPromptModal() {
  const { state, dispatch, navigate } = useAppState();

  if (!state.showAuthPrompt) return null;

  function goToAuth(mode: "signup" | "login") {
    dispatch({ type: "HIDE_AUTH_PROMPT" });
    navigate("auth");
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end"
      onClick={() => dispatch({ type: "HIDE_AUTH_PROMPT" })}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-[390px] mx-auto bg-white rounded-t-3xl pb-8 pt-2 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-4" />

        <button
          onClick={() => dispatch({ type: "HIDE_AUTH_PROMPT" })}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f0eeea] flex items-center justify-center text-[#7a7570]"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-2 flex flex-col items-center text-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
          >
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
              <circle cx="20" cy="20" r="5" fill="white" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-[#1a1a1a]">Sign up to continue</h3>
          <p className="text-sm text-[#7a7570] leading-relaxed max-w-[280px]">
            Create a free account to upload work, connect with clients, and save your favourites.
          </p>

          <div className="w-full flex flex-col gap-2.5 mt-3">
            <button
              onClick={() => goToAuth("signup")}
              className="w-full h-13 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] py-3.5"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Sign up
            </button>
            <button
              onClick={() => goToAuth("login")}
              className="w-full h-13 rounded-2xl font-semibold text-base text-[#6c47ff] border border-[#e8e4df] bg-white transition-all active:scale-[0.98] py-3.5"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
