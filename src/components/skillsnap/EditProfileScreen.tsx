"use client";
import { useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2, CheckCircle, MapPin, Pencil, X } from "lucide-react";
import type { Screen, SkillCategory } from "@/types";
import { SKILL_CATEGORIES } from "@/constants/config";
import { useAppState } from "@/state/AppState";
import { useToast } from "./shared/Toast";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

interface EditProfileScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function EditProfileScreen({ onNavigate }: EditProfileScreenProps) {
  const { state, dispatch } = useAppState();
  const { showToast } = useToast();
  const user = state.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username?.replace("@", "") ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  // If the stored skill is a known category, use it directly.
  // If it's a custom string (not in the list), pre-select "Other" and populate customSkill.
  const knownCategories = SKILL_CATEGORIES as readonly string[];
  const storedSkill = user?.skill ?? "";
  const isStoredCustom = storedSkill && !knownCategories.includes(storedSkill);
  const [skill, setSkill] = useState<SkillCategory | "">(isStoredCustom ? "Other" : (storedSkill as SkillCategory | ""));
  const [customSkill, setCustomSkill] = useState(isStoredCustom ? storedSkill : "");
  const [showCustomInput, setShowCustomInput] = useState(!!isStoredCustom);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "info");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!displayName.trim()) {
      showToast("Display name is required", "info");
      return;
    }
    setSaving(true);
    try {
      let avatarUrl: string | undefined = avatarPreview ?? user?.avatarUrl;
      const isAuthenticated = SUPABASE_CONFIGURED && !!state.currentUser && !state.isGuest;

      // persistedAvatarUrl is only a real remote URL (never a blob:) — safe to store in DB
      let persistedAvatarUrl: string | undefined = user?.avatarUrl;

      if (isAuthenticated) {
        // Try to upload new avatar to Supabase Storage
        if (avatarFile) {
          try {
            const { uploadService } = await import("@/services/uploadService");
            persistedAvatarUrl = await uploadService.uploadAvatar(avatarFile);
            avatarUrl = persistedAvatarUrl; // update local preview to remote URL too
          } catch (uploadErr) {
            console.warn("Avatar upload failed, keeping existing remote URL:", uploadErr);
            // avatarUrl stays as the local blob: preview for in-memory display,
            // but we don't persist it to DB
          }
        }
        // Try to persist profile to DB — non-fatal if it fails
        try {
          const { userService } = await import("@/services/userService");
          await userService.updateProfile({
            displayName: displayName.trim(),
            username: `@${username.trim()}`,
            bio: bio.trim(),
            location: location.trim(),
            skill: (skill === "Other" ? (customSkill.trim() || null) : (skill || null)) as string | null,
            // Only send avatarUrl to DB if it's a real remote URL
            ...(persistedAvatarUrl ? { avatarUrl: persistedAvatarUrl } : {}),
          });
        } catch (profileErr) {
          console.warn("Profile DB update failed:", profileErr);
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }

      // Always update in-memory state — use persisted URL if available, else local preview
      const inMemoryAvatarUrl: string | undefined = persistedAvatarUrl ?? (avatarPreview?.startsWith("blob:") ? undefined : (avatarPreview ?? undefined));
      dispatch({
        type: "UPDATE_CURRENT_USER",
        patch: {
          displayName: displayName.trim(),
          username: `@${username.trim()}`,
          bio: bio.trim(),
          location: location.trim(),
          skill: (skill === "Other" ? (customSkill.trim() || null) : (skill || null)) as string | null,
          ...(inMemoryAvatarUrl !== undefined ? { avatarUrl: inMemoryAvatarUrl } : {}),
        },
      });

      setSaved(true);
      setTimeout(() => onNavigate("own-profile"), 1200);
    } catch (err) {
      console.error("Save profile error:", err);
      showToast("Failed to save. Please try again.", "info");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : "?";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("own-profile")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-bold text-[#6c47ff] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
        </button>
      </header>

      {saved ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
            <CheckCircle size={30} className="text-green-500" />
          </div>
          <p className="font-bold text-[#1a1a1a] text-lg">Profile updated!</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {/* Avatar */}
          <div className="flex flex-col items-center py-8 bg-white border-b border-[#e8e4df]">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-md"
                  style={{ background: user.avatarGradient }}
                >
                  {initials}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#6c47ff] flex items-center justify-center text-white shadow-md border-2 border-white"
              >
                <Camera size={16} />
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-[#b0aaa5] mt-3">Tap camera to change photo</p>
          </div>

          {/* Form */}
          <div className="px-4 py-5 flex flex-col gap-5">
            {/* Display name */}
            <Field label="Display Name">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="Your full name"
                className="w-full bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none focus:border-[#6c47ff] transition-colors"
              />
            </Field>

            {/* Username */}
            <Field label="Username">
              <div className="flex items-center bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 gap-1 focus-within:border-[#6c47ff] transition-colors">
                <span className="text-[#b0aaa5] text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30))
                  }
                  placeholder="username"
                  className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
                />
              </div>
            </Field>

            {/* Bio */}
            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Describe your skills and experience…"
                className="w-full bg-white rounded-2xl border border-[#e8e4df] px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed"
              />
              <p className="text-right text-xs text-[#b0aaa5] mt-1">{bio.length} / 200</p>
            </Field>

            {/* Location */}
            <Field label="Location">
              <div className="flex items-center bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 gap-2.5 focus-within:border-[#6c47ff] transition-colors">
                <MapPin size={15} className="text-[#6c47ff] flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Liverpool, NSW"
                  className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
                />
              </div>
            </Field>

            {/* Skill */}
            <Field label="Skill Category">
              <div className="flex flex-wrap gap-2">
                {(SKILL_CATEGORIES as readonly string[]).filter((c) => c !== "Other").map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSkill(skill === cat ? "" : cat as SkillCategory);
                      setShowCustomInput(false);
                      setCustomSkill("");
                    }}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-all active:scale-95 ${
                      skill === cat
                        ? "bg-[#6c47ff] text-white border-[#6c47ff]"
                        : "bg-white text-[#7a7570] border-[#e8e4df]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (skill === "Other") {
                      setSkill("");
                      setShowCustomInput(false);
                      setCustomSkill("");
                    } else {
                      setSkill("Other");
                      setShowCustomInput(true);
                      setTimeout(() => customInputRef.current?.focus(), 80);
                    }
                  }}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-all active:scale-95 flex items-center gap-1.5 ${
                    skill === "Other"
                      ? "bg-[#6c47ff] text-white border-[#6c47ff]"
                      : "bg-white text-[#7a7570] border-[#e8e4df]"
                  }`}
                >
                  <Pencil size={10} />
                  Other
                </button>
              </div>

              {/* Custom skill input — visible when Other is selected */}
              {showCustomInput && (
                <div className="mt-3">
                  <div
                    style={{ border: "2px solid #6c47ff" }}
                    className="bg-white rounded-2xl px-4 h-12 flex items-center gap-2.5"
                  >
                    <Pencil size={14} className="text-[#6c47ff] flex-shrink-0" />
                    <input
                      ref={customInputRef}
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value.slice(0, 40))}
                      placeholder="e.g. Carpenter, Hairdresser, Chef…"
                      className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
                    />
                    {customSkill ? (
                      <button type="button" onClick={() => setCustomSkill("")} className="text-[#b0aaa5] flex-shrink-0">
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#b0aaa5] mt-1.5 px-1">
                    This will appear as your skill on your profile.
                  </p>
                </div>
              )}

              {/* Live preview badge */}
              {((skill && skill !== "Other") || (skill === "Other" && customSkill.trim())) && (
                <div className="flex items-center gap-2 mt-2 px-1">
                  <span className="text-[10px] font-bold text-[#b0aaa5] uppercase tracking-wider">Preview:</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ede9fe] text-[#5b3dd8]">
                    {skill === "Other" ? customSkill.trim() : skill}
                  </span>
                </div>
              )}
            </Field>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              {saving ? <><Loader2 size={20} className="animate-spin" /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
