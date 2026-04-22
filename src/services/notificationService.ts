// ─────────────────────────────────────────────
// SkillSnap — Notification Service
// Integration point: swap for push/in-app notifications
// (Firebase FCM / OneSignal / Supabase Realtime)
// ─────────────────────────────────────────────
import type { Notification } from "@/types";
import { MOCK_USERS } from "@/mock-data/users";

const [, priya, jake] = MOCK_USERS;

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    type: "like",
    fromUser: { id: priya.id, displayName: priya.displayName, avatarInitial: priya.avatarInitial, avatarGradient: priya.avatarGradient },
    message: "liked your post",
    read: false,
    createdAt: "2026-04-21T09:00:00Z",
  },
  {
    id: "notif_2",
    type: "follow",
    fromUser: { id: jake.id, displayName: jake.displayName, avatarInitial: jake.avatarInitial, avatarGradient: jake.avatarGradient },
    message: "started following you",
    read: false,
    createdAt: "2026-04-21T08:30:00Z",
  },
  {
    id: "notif_3",
    type: "job_verified",
    fromUser: { id: priya.id, displayName: priya.displayName, avatarInitial: priya.avatarInitial, avatarGradient: priya.avatarGradient },
    message: "confirmed your job — Jobs Done count updated!",
    read: true,
    createdAt: "2026-04-20T16:00:00Z",
  },
];

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    // TODO: GET /notifications
    return MOCK_NOTIFICATIONS;
  },

  async markAllRead(): Promise<void> {
    // TODO: PATCH /notifications/read-all
  },

  async markRead(_id: string): Promise<void> {
    // TODO: PATCH /notifications/:id/read
  },

  getUnreadCount(): number {
    // TODO: subscribe to real-time badge count
    return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  },
};
