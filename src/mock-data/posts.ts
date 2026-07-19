// ─────────────────────────────────────────────
// SkillSnap — Mock Posts / Feed
// Replace with postService.getFeed() API calls
// ─────────────────────────────────────────────
import type { Post } from "@/types";
import { MOCK_USERS } from "./users";

const [marcus, priya, jake, sam, ana] = MOCK_USERS;

// Vivid gradient palette — used as thumbnail placeholders
const THUMB_GRADIENTS = [
  "linear-gradient(160deg, #6c47ff 0%, #a855f7 60%, #ec4899 100%)",
  "linear-gradient(160deg, #0ea5e9 0%, #6366f1 60%, #8b5cf6 100%)",
  "linear-gradient(160deg, #f59e0b 0%, #ef4444 60%, #ec4899 100%)",
  "linear-gradient(160deg, #10b981 0%, #0ea5e9 60%, #6366f1 100%)",
  "linear-gradient(160deg, #f97316 0%, #eab308 60%, #84cc16 100%)",
  "linear-gradient(160deg, #ec4899 0%, #f43f5e 60%, #ef4444 100%)",
  "linear-gradient(160deg, #14b8a6 0%, #06b6d4 60%, #3b82f6 100%)",
  "linear-gradient(160deg, #a855f7 0%, #ec4899 60%, #f97316 100%)",
  "linear-gradient(160deg, #22c55e 0%, #16a34a 60%, #065f46 100%)",
];

export function randomGradient(seed: string): string {
  // Deterministic pick from seed so it's stable across renders
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return THUMB_GRADIENTS[hash % THUMB_GRADIENTS.length];
}

export const MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    authorId: marcus.id,
    author: marcus,
    type: "video",
    thumbnailGradient: randomGradient("post_1"),
    caption: "Fresh fade for the weekend 🔥 Skin fade with razor sharp lines — book me for your next cut!",
    skill: "Barber",
    location: "Sydney CBD",
    likes: 2400,
    likedByMe: false,
    savedByMe: false,
    viewCount: 15200,
    createdAt: "2026-04-20T10:30:00Z",
  },
  {
    id: "post_2",
    authorId: priya.id,
    author: priya,
    type: "video",
    thumbnailGradient: randomGradient("post_2"),
    caption: "Bridal look for Sarah's big day 💕 Full glam, soft glitter eye, and flawless base. DM to book!",
    skill: "Makeup Artist",
    location: "Melbourne",
    likes: 5100,
    likedByMe: true,
    savedByMe: false,
    viewCount: 28400,
    createdAt: "2026-04-21T08:00:00Z",
  },
];

// Work grid items per user (placeholder thumbnails)
export const MOCK_WORK_GRID = [
  { gradient: randomGradient("wg0"), hasVideo: true },
  { gradient: randomGradient("wg1"), hasVideo: true },
  { gradient: randomGradient("wg2"), hasVideo: false },
  { gradient: randomGradient("wg3"), hasVideo: true },
  { gradient: randomGradient("wg4"), hasVideo: false },
  { gradient: randomGradient("wg5"), hasVideo: true },
  { gradient: randomGradient("wg6"), hasVideo: true },
  { gradient: randomGradient("wg7"), hasVideo: false },
  { gradient: randomGradient("wg8"), hasVideo: true },
];

export const MOCK_SAVED_GRID = [
  { gradient: "linear-gradient(135deg, #667eea, #764ba2)", hasVideo: true, label: "Barber" },
  { gradient: "linear-gradient(135deg, #f093fb, #f5576c)", hasVideo: true, label: "Makeup" },
  { gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", hasVideo: false, label: "Tiler" },
  { gradient: "linear-gradient(135deg, #43e97b, #38f9d7)", hasVideo: true, label: "PT" },
  { gradient: "linear-gradient(135deg, #fa709a, #fee140)", hasVideo: false, label: "Cleaner" },
  { gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)", hasVideo: true, label: "Nails" },
];

export function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
