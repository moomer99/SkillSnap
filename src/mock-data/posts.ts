// ─────────────────────────────────────────────
// SkillSnap — Mock Posts / Feed
// Replace with postService.getFeed() API calls
// ─────────────────────────────────────────────
import type { Post } from "@/types";
import { MOCK_USERS } from "./users";

const [marcus, priya, jake, sam, ana] = MOCK_USERS;

export const MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    authorId: marcus.id,
    author: marcus,
    type: "video",
    thumbnailGradient: "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    caption: "Fresh fade for the weekend 🔥 Skin fade with razor sharp lines — book me for your next cut!",
    likes: 2400,
    likedByMe: false,
    savedByMe: false,
    createdAt: "2026-04-20T10:30:00Z",
  },
  {
    id: "post_2",
    authorId: priya.id,
    author: priya,
    type: "video",
    thumbnailGradient: "linear-gradient(160deg, #2d1b33 0%, #4a1942 50%, #6b2d6b 100%)",
    caption: "Bridal look for Sarah's big day 💕 Full glam, soft glitter eye, and flawless base. DM to book!",
    likes: 5100,
    likedByMe: true,
    savedByMe: false,
    createdAt: "2026-04-21T08:00:00Z",
  },
  {
    id: "post_3",
    authorId: jake.id,
    author: jake,
    type: "video",
    thumbnailGradient: "linear-gradient(160deg, #0d2137 0%, #1a3a5c 50%, #1e5680 100%)",
    caption: "Herringbone bathroom reno complete ✅ 12 sqm transformation — client was stoked. Ask me for a free quote.",
    likes: 1800,
    likedByMe: false,
    savedByMe: false,
    createdAt: "2026-04-19T14:00:00Z",
  },
  {
    id: "post_4",
    authorId: sam.id,
    author: sam,
    type: "video",
    thumbnailGradient: "linear-gradient(160deg, #0d3320 0%, #1a5c3a 50%, #1e8060 100%)",
    caption: "6-week transformation 💪 Consistency, discipline, and the right program. DM for online coaching.",
    likes: 3200,
    likedByMe: false,
    savedByMe: true,
    createdAt: "2026-04-18T09:00:00Z",
  },
  {
    id: "post_5",
    authorId: ana.id,
    author: ana,
    type: "photo",
    thumbnailGradient: "linear-gradient(160deg, #3a2010 0%, #7a4520 50%, #a86030 100%)",
    caption: "Before & after kitchen deep clean ✨ Sparkle guaranteed. Book weekly or fortnightly service.",
    likes: 940,
    likedByMe: false,
    savedByMe: false,
    createdAt: "2026-04-17T11:00:00Z",
  },
];

// Work grid items per user (placeholder thumbnails)
export const MOCK_WORK_GRID = [
  { gradient: "linear-gradient(135deg, #1a1a2e, #0f3460)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #2d1b33, #6b2d6b)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #0d2137, #1e5680)", hasVideo: false },
  { gradient: "linear-gradient(135deg, #1a3a1a, #2d6b2d)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #3a1a1a, #8b3333)", hasVideo: false },
  { gradient: "linear-gradient(135deg, #2a1a3a, #5b3dd8)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #1a2a3a, #1e4d7a)", hasVideo: true },
  { gradient: "linear-gradient(135deg, #3a2a1a, #7a5228)", hasVideo: false },
  { gradient: "linear-gradient(135deg, #1a3a2a, #2d7a5b)", hasVideo: true },
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
