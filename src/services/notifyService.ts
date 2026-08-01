// ─────────────────────────────────────────────
// SkillSnap — outbound notifications (push + email)
// ─────────────────────────────────────────────
// Mirrors src/services/pushService.ts in the mobile repo. Until now the web app
// contained zero functions.invoke calls: sending a message from the web wrote a
// row and nothing else, so the recipient was never notified on any channel no
// matter what their settings said.
//
// Distinct from notificationService.ts, which is the in-app notifications list.
// This one is outbound delivery.
//
// Both Edge Functions authorise the caller from their JWT, derive the sender's
// name and the recipient's address server-side, and honour the recipient's
// notify_* preferences. The client only says who and what type; nothing it
// sends is trusted as display text.

import { getAuthSupabase } from "@/lib/supabase";

export type NotificationType = "message" | "follow" | "job" | "connection";

type NotifyArgs = {
  toUserId: string;
  type: NotificationType;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  /** Required for type "message": proves the caller is in the conversation. */
  conversationId?: string;
};

/**
 * Fire-and-forget on purpose.
 *
 * A notification failing must never break the action that triggered it. A
 * message that was written but whose push 500'd is still a delivered message;
 * an exception here would make it look like a failed send.
 *
 * A resolved promise does not mean anything arrived: both functions no-op when
 * the recipient has that category switched off, has no push token, or has no
 * email on file.
 */
export async function notifyUser({
  toUserId,
  type,
  title = "",
  body = "",
  data,
  conversationId,
}: NotifyArgs): Promise<void> {
  const sb = getAuthSupabase();

  const payload = {
    to_user_id: toUserId,
    type,
    title,
    body,
    data: data ?? {},
    conversation_id: conversationId,
  };

  // Both channels, independently. Email is not a fallback for push — a user can
  // have either, both or neither switched on, and each function checks its own
  // preference column.
  const results = await Promise.allSettled([
    sb.functions.invoke("send-push-notification", { body: payload }),
    sb.functions.invoke("send-notification-email", { body: payload }),
  ]);

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.log(`[notify] ${i === 0 ? "push" : "email"} failed (non-fatal):`, result.reason);
    }
  });
}
