// ─────────────────────────────────────────────
// SkillSnap — Core Data Models
// Replace with API-shaped DTOs when backend is ready
// ─────────────────────────────────────────────

export type ProfileVariant = "own" | "client";

import type { SKILL_CATEGORIES } from "@/constants/config";
export type SkillCategory = (typeof SKILL_CATEGORIES)[number] | (string & {});

// ── User / Profile ──────────────────────────
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;          // real image URL from Supabase Storage
  avatarGradient: string;      // fallback gradient when no image
  avatarInitial: string;
  location: string;
  lat?: number;                // GPS latitude (stored privately)
  lng?: number;                // GPS longitude (stored privately)
  locationPrivate?: boolean;   // if true, only show suburb publicly
  bio: string;
  skill: SkillCategory | null; // null = client/viewer
  isVerified: boolean;
  jobsDone: number;
  happyPercent: number;        // % of happy feedback from completed jobs
  ratingCount?: number;        // number of ratings received (hide happy% below 3)
  followers: number;
  following: number;
  postCount: number;
  isClient: boolean;
  role: 'client' | 'pro' | null;
  distanceKm?: number;         // distance from viewer (populated at query time)
}

// ── Feedback / Happy % ───────────────────────
export interface JobFeedback {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  happy: boolean;
  comment: string;
  createdAt: string;
}

// ── Post / Feed ──────────────────────────────
export type PostType = "video" | "photo";

export interface PostMediaItem {
  url: string;
  type: "video" | "photo";
  orderIndex: number;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  type: PostType;
  mediaUrl?: string;          // real media URL from Supabase Storage
  thumbnailUrl?: string;      // thumbnail image URL
  thumbnailGradient: string;  // gradient fallback when no media
  mediaItems?: PostMediaItem[]; // multi-media support
  caption: string;
  skill?: SkillCategory | null;  // post-level skill tag
  location?: string | null;      // post-level location (overrides author location in UI)
  likes: number;
  commentsCount: number;   // from visible_posts.comments_count
  recommendCount: number;  // from visible_posts.recommend_count
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string; // ISO date string
  viewCount?: number; // showcase view count
}

// ── Message / Chat ───────────────────────────
export type MessageSender = "me" | "them";

export interface Message {
  id: string;
  threadId: string;
  from: MessageSender;
  text: string;
  imageUrl?: string;
  time: string;
  senderName?: string;
  failed?: boolean;
  uploading?: boolean; // true while image is being uploaded — shows spinner overlay
  isSystem?: boolean;
  createdAt?: string;
}

export interface MessageThread {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  startedAt?: string; // ISO — when the first message was sent
  jobConfirmed?: boolean; // true when a jobs_done row is fully confirmed in this conversation
}

// ── Job Done Flow ────────────────────────────
export type JobDoneStatus = "idle" | "requested" | "confirmed" | "feedback_done" | "declined";
export type JobRating = "very_happy" | "okay" | "not_satisfied";

// ── Discovery / Map ──────────────────────────
export interface DiscoveryPin {
  id: string;
  userId: string;
  name: string;
  skill: SkillCategory;
  color: string;
  rating: number;
  jobsDone: number;
  // Real coordinates from profiles.lat_public / lng_public, absent when the
  // profile has no known position. Never a placeholder: a pro without
  // coordinates still appears in the results grid, just not on the map.
  lat?: number;
  lng?: number;
  // Hydrated from the profile row for rendering the pin/card
  avatarUrl?: string | null;
  avatarInitial?: string | null;
  avatarGradient?: string | null;
  location?: string | null;
}

/** A pin known to have real coordinates — the only kind the map accepts. */
export type MappableDiscoveryPin = DiscoveryPin & { lat: number; lng: number };

/**
 * Every skilled pro, plus the subset that can be placed on a map.
 * The results grid renders `allPros`; the map renders `mappablePros`.
 */
export interface DiscoveryResults {
  allPros: DiscoveryPin[];
  mappablePros: MappableDiscoveryPin[];
}

// ── Jobs Done ────────────────────────────────
export interface JobRecord {
  id: string;
  skillerId: string;
  clientId: string;
  description: string;
  verifiedAt: string; // ISO date
}

// ── Follow / Like / Save ─────────────────────
export interface FollowRelationship {
  followerId: string;
  followingId: string;
}

export interface LikeState {
  postId: string;
  userId: string;
}

export interface SavedPost {
  postId: string;
  userId: string;
}

// ── Notification ─────────────────────────────
export type NotificationType = "like" | "follow" | "message" | "job_verified";

export interface Notification {
  id: string;
  type: NotificationType;
  fromUser: Pick<User, "id" | "displayName" | "avatarInitial" | "avatarGradient">;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Navigation ───────────────────────────────
export type Screen =
  | "landing"
  | "onboarding"
  | "auth"
  | "home"
  | "discover"
  | "search"
  | "upload"
  | "messages"
  | "chat"
  | "own-profile"      // My Profile
  | "client-profile"   // Client Profile
  | "edit-profile"
  | "settings"
  | "pro"
  | "contact"
  | "help"
  | "about"
  | "terms"
  | "reset-password"
  | "role-setup"
  | "username-setup";
