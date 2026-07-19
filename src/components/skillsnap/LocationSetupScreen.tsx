"use client";
import { useState } from "react";
import { Loader2, Navigation } from "lucide-react";
import { useAppState } from "@/state/AppState";
import type { Screen } from "@/types";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function LocationSetupScreen({ onNavigate }: Props) {
  const { state, dispatch } = useAppState();
  const [location, setLocation] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gpsMessage, setGpsMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [saving, setSaving] = useState(false);

  const canFinish = location.trim().length > 0;

  async function handleGps() {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsMessage("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("loading");
    setGpsMessage("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const suburb =
            data.address?.suburb ||
            data.address?.town ||
            data.address?.city ||
            data.address?.county ||
            "";
          const state_ =
            data.address?.state_code ||
            data.address?.state ||
            "";
          const detected = suburb
            ? state_ ? `${suburb}, ${state_}` : suburb
            : data.display_name?.split(",")[0] ?? "";
          if (detected) {
            setLocation(detected);
            setGpsStatus("success");
            setGpsMessage(`Detected: ${detected}`);
          } else {
            setGpsStatus("error");
            setGpsMessage("Could not detect location. Please enter manually.");
          }
        } catch {
          setGpsStatus("error");
          setGpsMessage("Could not detect location. Please enter manually.");
        }
      },
      () => {
        setGpsStatus("error");
        setGpsMessage("Could not detect location. Please enter manually.");
      },
      { timeout: 10000 }
    );
  }

  async function handleFinish() {
    if (!canFinish) { setShowError(true); return; }
    setShowError(false);
    setSaving(true);

    const locationValue = location.trim();

    try {
      if (SUPABASE_CONFIGURED && state.currentUser) {
        const { userService } = await import("@/services/userService");
        await userService.updateProfile({ location: locationValue });
      }
    } catch (e) {
      console.warn("[LocationSetupScreen] updateProfile failed:", e);
    }

    dispatch({ type: "UPDATE_CURRENT_USER", patch: { location: locationValue } });

    const role = state.currentUser?.role;
    if (role === "client") {
      localStorage.setItem("skillsnap_show_client_welcome", "1");
    } else {
      localStorage.setItem("skillsnap_show_pro_welcome", "1");
    }

    dispatch({ type: "NAVIGATE", screen: "home" });
    setSaving(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">

      {/* Progress indicator */}
      <div className="pt-10 px-6 pb-2 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-[#6c47ff]" />
          <div className="h-1.5 w-16 rounded-full bg-[#6c47ff]" />
        </div>
        <p className="text-xs text-[#7a7570] font-medium">Step 2 of 2</p>
      </div>

      {/* Header */}
      <div className="px-6 text-center pt-3 pb-6">
        <img src="/skillsnap-icon.svg" alt="SkillSnap" width={52} height={52} className="mx-auto mb-4" />
        <h1 className="text-2xl font-black text-[#1a1a1a] mb-1">Where are you based?</h1>
        <p className="text-[#7a7570] text-sm">Help locals find you nearby</p>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pb-4">

        {/* Option A — GPS */}
        <button
          onClick={handleGps}
          disabled={gpsStatus === "loading"}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl mb-2 transition-all active:scale-[0.98] bg-white"
          style={{
            border: `2px solid ${gpsStatus === "success" ? "#6c47ff" : "#e8e4df"}`,
            background: gpsStatus === "success" ? "#f5f3ff" : "white",
          }}
        >
          {gpsStatus === "loading" ? (
            <Loader2 size={22} className="text-[#6c47ff] animate-spin flex-shrink-0" />
          ) : (
            <Navigation size={22} className="flex-shrink-0" style={{ color: gpsStatus === "success" ? "#6c47ff" : "#7a7570" }} />
          )}
          <span
            className="font-semibold text-sm"
            style={{ color: gpsStatus === "success" ? "#6c47ff" : "#1a1a1a" }}
          >
            {gpsStatus === "loading" ? "Detecting location…" : "Use My Location"}
          </span>
        </button>

        {/* GPS status message */}
        {gpsMessage && (
          <p
            className="text-xs px-1 mb-3"
            style={{ color: gpsStatus === "success" ? "#6c47ff" : "#e05252" }}
          >
            {gpsMessage}
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-4 px-1">
          <div className="flex-1 h-px bg-[#e8e4df]" />
          <span className="text-xs text-[#b0aaa5] font-medium">or</span>
          <div className="flex-1 h-px bg-[#e8e4df]" />
        </div>

        {/* Option B — Manual input */}
        <input
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setShowError(false);
            if (gpsStatus === "success") setGpsStatus("idle");
          }}
          placeholder="Enter your suburb e.g. Liverpool, NSW"
          className="w-full h-12 px-4 bg-white rounded-xl border text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none transition-colors"
          style={{ borderColor: showError ? "#e05252" : location ? "#6c47ff" : "#e8e4df", borderWidth: 2 }}
        />

        {/* Inline error */}
        {showError && (
          <p className="text-xs text-[#e05252] mt-1.5 px-1">Please add your location to continue</p>
        )}
      </div>

      {/* Finish button */}
      <div className="px-4 pb-10 pt-3 bg-[#f8f7f5]">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: canFinish ? "linear-gradient(135deg, #6c47ff, #8b6af5)" : "#d1cec9",
            boxShadow: canFinish ? "0 4px 16px rgba(108,71,255,0.30)" : "none",
          }}
        >
          {saving ? <><Loader2 size={20} className="animate-spin" /> Saving…</> : "Finish Setup"}
        </button>
      </div>
    </div>
  );
}
