"use client";
// ─────────────────────────────────────────────
// SkillSnap — Upload / Showcase Screen
// Wired to uploadService.createPost() + Supabase Storage
// ─────────────────────────────────────────────
import { useState, useRef } from "react";
import { Video, Image as ImageIcon, ChevronDown, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import type { Screen, SkillCategory } from "@/types";
import { SKILL_CATEGORIES, MAP_CONFIG } from "@/constants/config";
import { uploadService } from "@/services/uploadService";
import { useAppState } from "@/state/AppState";
import { useToast } from "./shared/Toast";

interface UploadScreenProps {
  onNavigate: (s: Screen) => void;
}

type ContentType = "video" | "photo" | "social";

export default function UploadScreen({ onNavigate }: UploadScreenProps) {
  const { dispatch } = useAppState();
  const { comingSoon } = useToast();
  const [contentType, setContentType] = useState<ContentType>("video");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [skill, setSkill] = useState<SkillCategory | "">("");
  const [location] = useState(MAP_CONFIG.DEFAULT_LOCATION_LABEL);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ["video/mp4", "video/quicktime", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported file type. Use MP4 or MOV for video, JPG/PNG/WebP for photos.");
      e.target.value = "";
      return;
    }

    // Validate file size
    const maxMB = file.type.startsWith("video/") ? 60 : 10;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxMB}MB.`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  function handleTypeSelect(type: ContentType) {
    setContentType(type);
    setSelectedFile(null);
    setPreviewUrl(null);
    // Always reset the input value so re-selecting the same type re-opens the picker
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openPicker(type: ContentType) {
    // Set the correct accept attribute synchronously by writing it directly on the element
    // before calling click(), because React state updates are async
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === "video" ? "video/mp4,video/quicktime" : "image/jpeg,image/png,image/webp";
      fileInputRef.current.value = "";
    }
    handleTypeSelect(type);
    // Defer the click so the input is reset first
    setTimeout(() => fileInputRef.current?.click(), 0);
  }

  // Convert file to a data URL so it works in any sandbox/iframe context
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Capture a JPEG thumbnail from the already-rendered preview video element
  function capturePreviewThumbnail(): string | null {
    const vid = videoPreviewRef.current;
    if (!vid || vid.readyState < 2) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = vid.videoWidth || 390;
      canvas.height = vid.videoHeight || 520;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      return null;
    }
  }

  async function handlePublish() {
    if (!caption.trim() && !selectedFile) {
      setError("Add a caption or select a file before publishing.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Convert file to data URL before passing to service so it's sandbox-safe
      let dataUrl: string | undefined;
      if (selectedFile) {
        dataUrl = await fileToDataUrl(selectedFile);
      }

      const newPost = await uploadService.createPost({
        file: selectedFile ?? undefined,
        dataUrl,
        caption: caption.trim(),
        skill: skill,
        location,
      });

      if (newPost) {
        // Capture thumbnail from the already-loaded preview video (no re-loading needed)
        if (selectedFile?.type.startsWith("video/")) {
          const thumb = capturePreviewThumbnail();
          if (thumb) newPost.thumbnailUrl = thumb;
        }
        dispatch({ type: "PREPEND_POST", post: newPost });
      }
      dispatch({ type: "REFRESH_FEED" });
      setPosted(true);
      setTimeout(() => onNavigate("own-profile"), 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to publish. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (posted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f7f5] gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-[#ede9fe] flex items-center justify-center">
          <CheckCircle size={32} className="text-[#6c47ff]" />
        </div>
        <p className="text-base font-bold text-[#1a1a1a]">Published!</p>
        <p className="text-sm text-[#7a7570]">Your work is now live on the feed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("home")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Showcase Your Work</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-28 px-4 pt-5 flex flex-col gap-5">
        {/* Upload type */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-3 block">
            Choose content
          </label>
          <div className="flex flex-col gap-3">
            <UploadButton
              icon={<Video size={22} className="text-[#6c47ff]" />}
              title="Upload Video"
              subtitle="MP4 or MOV, up to 60MB"
              active={contentType === "video"}
              onClick={() => openPicker("video")}
            />
            <UploadButton
              icon={<ImageIcon size={22} className="text-[#6c47ff]" />}
              title="Upload Photo"
              subtitle="JPG, PNG or WebP, up to 10MB"
              active={contentType === "photo"}
              onClick={() => openPicker("photo")}
            />
            <UploadButton
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="50%" stopColor="#dc2743" />
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
              active={false}
              onClick={() => comingSoon("Social media import")}
            />
          </div>
          {/* Hidden file input — accept attribute set dynamically in openPicker() */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Preview */}
        {previewUrl ? (
          <div className="rounded-2xl overflow-hidden border border-[#e8e4df] bg-white relative">
            {contentType === "video" ? (
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                className="w-full max-h-[280px] object-cover"
                controls
                playsInline
                muted
              />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full max-h-[280px] object-cover" />
            )}
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => contentType !== "social" && openPicker(contentType as "video" | "photo")}
            className="bg-white rounded-2xl border border-dashed border-[#c4b5fd] p-6 flex flex-col items-center gap-3 w-full"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center">
              <Video size={26} className="text-[#6c47ff]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">No content selected</p>
              <p className="text-xs text-[#7a7570]">Tap to choose a video or photo</p>
            </div>
          </button>
        )}

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 150))}
            placeholder="Describe your work — what skill, what service, what result..."
            rows={3}
            className="w-full bg-white rounded-2xl border border-[#e8e4df] p-4 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed"
          />
          <p className="text-right text-xs text-[#b0aaa5] mt-1">{caption.length} / 150</p>
        </div>

        {/* Skill category */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">
            Skill Category
          </label>
          <div className="bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 flex items-center justify-between relative">
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value as SkillCategory | "")}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            >
              <option value="">Select your skill...</option>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className={`text-sm ${skill ? "text-[#1a1a1a]" : "text-[#b0aaa5]"}`}>
              {skill || "Select your skill..."}
            </span>
            <ChevronDown size={16} className="text-[#b0aaa5]" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {SKILL_CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setSkill(skill === cat ? "" : cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  skill === cat
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[#1a1a1a] text-sm font-medium">{location}</span>
            <span className="ml-auto text-[10px] text-[#6c47ff] font-semibold bg-[#ede9fe] px-2 py-0.5 rounded-full">Auto</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Publish button */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 pb-4 pt-3 bg-white/95 backdrop-blur-sm border-t border-[#e8e4df]">
        <button
          onClick={handlePublish}
          disabled={loading || (!caption.trim() && !selectedFile)}
          className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          {loading ? <><Loader2 size={20} className="animate-spin" /> Publishing…</> : "Publish"}
        </button>
      </div>
    </div>
  );
}

function UploadButton({
  icon, title, subtitle, active, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${active ? "border-[#c4b5fd] bg-[#faf8ff]" : "border-[#e8e4df] bg-white"}`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: active ? "#ede9fe" : "#f0eeea" }}
      >
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
