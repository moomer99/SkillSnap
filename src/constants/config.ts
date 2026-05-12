// ─────────────────────────────────────────────
// SkillSnap — App Config & Environment Placeholders
// Replace values with real env vars when backend is connected
// ─────────────────────────────────────────────

export const APP_CONFIG = {
  name: "SkillSnap",
  tagline: "Watch. Trust. Connect.",
  subtitle: "Discover real skills near you",
  version: "1.0.0",
} as const;

// API — swap BASE_URL with process.env.NEXT_PUBLIC_API_URL
export const API_CONFIG = {
  BASE_URL: "", // e.g. "https://api.skillsnap.app/v1"
  TIMEOUT_MS: 10_000,
} as const;

// Auth — swap with real provider config (Supabase / Firebase / Auth0)
export const AUTH_CONFIG = {
  PROVIDER: "supabase",
  AUTH_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

// Database — swap with real DB connection details
export const DB_CONFIG = {
  PROVIDER: "", // e.g. "supabase" | "planetscale" | "neon"
  URL: "",
} as const;

// Maps — swap with real maps SDK key
export const MAP_CONFIG = {
  PROVIDER: "", // e.g. "mapbox" | "google"
  API_KEY: "", // e.g. process.env.NEXT_PUBLIC_MAP_KEY
  DEFAULT_LAT: -33.9214,
  DEFAULT_LNG: 150.9224,
  DEFAULT_ZOOM: 13,
  DEFAULT_LOCATION_LABEL: "Liverpool, NSW",
} as const;

// Media storage — swap with real storage bucket config
export const MEDIA_CONFIG = {
  PROVIDER: "supabase-storage",
  BUCKET_URL: "https://dnraeyxjzdmpdvrkzyfd.supabase.co/storage/v1/object/public",
  MAX_VIDEO_SIZE_MB: 60,
  MAX_PHOTO_SIZE_MB: 10,
  ACCEPTED_VIDEO_TYPES: ["video/mp4", "video/quicktime"],
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// Feature flags — flip to true as features ship
export const FEATURES = {
  REAL_AUTH: true,
  REAL_FEED: true,
  REAL_MESSAGES: true,
  REAL_DISCOVERY: true,
  REAL_UPLOAD: true,
  NOTIFICATIONS: true,
} as const;

// Jobs Done trust system
export const JOBS_DONE_CONFIG = {
  TOOLTIP_TEXT:
    "Jobs Done are confirmed after users complete work and verify it through chat. This reflects real work done, not ratings.",
  TRUST_NOTE: "Verified by both parties — no self-reporting",
  // TODO: change back to 24 before launch
  MIN_CONVERSATION_HOURS: 1 / 60, // 1 minute for testing
} as const;

// Brand colors (used in dynamic styles)
export const BRAND = {
  PRIMARY: "#6c47ff",
  PRIMARY_DARK: "#5b3dd8",
  PRIMARY_LIGHT: "#8b6af5",
  PRIMARY_BG: "#ede9fe",
  SURFACE: "#f8f7f5",
  BORDER: "#e8e4df",
  MUTED: "#7a7570",
  MUTED_LIGHT: "#b0aaa5",
} as const;

export const SKILL_CATEGORIES = [
  "Client",
  "Automotive",
  "Barber",
  "Carpenter",
  "Chef",
  "Cleaner",
  "Concreter",
  "Driving Instructor",
  "Electrician",
  "Event Planner",
  "Florist",
  "Graphic Designer",
  "Interior Designer",
  "Landscaper",
  "Life Coach",
  "Makeup Artist",
  "Mechanic",
  "Mover",
  "Musician",
  "Nail Tech",
  "Painter",
  "Personal Trainer",
  "Pet Groomer",
  "DJ",
  "Photographer",
  "Plasterer",
  "Plumber",
  "Roofer",
  "Singer",
  "Tattoo Artist",
  "Tiler",
  "Tutor",
  "Videographer",
  "Web Developer",
  "Wedding Stylist",
  "Welder",
  "Yoga Instructor",
  "Other",
] as const;
