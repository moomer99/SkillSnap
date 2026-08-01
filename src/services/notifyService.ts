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

  await Promise.all(results.map((result, i) => reportOutcome(CHANNELS[i], result)));
}

const CHANNELS = ["push", "email"] as const;

type InvokeResult = PromiseSettledResult<{ data: unknown; error: unknown }>;

/**
 * Pulls the Edge Function's own reason out of a failed invoke.
 *
 * supabase-js sets `error.message` to the constant "Edge Function returned a
 * non-2xx status code", which says nothing. The real reason is in the attached
 * Response body. When there is no `error` key, the whole body is returned
 * instead — the push function reports Expo's per-message failures
 * (DeviceNotRegistered, MismatchSenderId) under `expo_errors`, and those are
 * the ones worth reading.
 */
async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response }).context;

  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      if (body && typeof body.error === "string") return body.error;
      if (body) return JSON.stringify(body);
    } catch {
      // Non-JSON body (a gateway error page, say) — fall through.
    }
  }

  if (context?.status) return `${fallback} (HTTP ${context.status})`;

  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Says what actually happened to one channel.
 *
 * The check that used to be here — allSettled plus status === "rejected" —
 * could never fire. functions.invoke resolves with { data, error } on a non-2xx
 * rather than rejecting, so a 403 from callerMayNotify and a 502 carrying an
 * Expo ticket error both arrived as "fulfilled" and were dropped. The push
 * channel was broken for weeks with nothing said on either client.
 *
 * Still fire-and-forget: this only logs. A message that was written and whose
 * notification failed is a delivered message, and must not be reported to the
 * sender as a failed send.
 */
async function reportOutcome(channel: (typeof CHANNELS)[number], result: InvokeResult) {
  try {
    // A genuine throw — the network is down, or the client itself failed.
    if (result.status === "rejected") {
      console.warn(`[notify] ${channel} threw (non-fatal):`, result.reason);
      return;
    }

    const { data, error } = result.value;

    if (error) {
      const detail = await readFunctionError(error, `${channel} notification failed`);
      console.warn(`[notify] ${channel} FAILED (non-fatal):`, detail);
      return;
    }

    // A 200 that delivered nothing: the category is switched off, or there is
    // no device or address on file. Not a failure, but it is the other way a
    // notification quietly does not arrive.
    if (data && typeof data === "object" && "skipped" in data) {
      console.log(`[notify] ${channel} skipped:`, (data as { skipped: unknown }).skipped);
    }
  } catch (err) {
    // Reporting a failure must not itself become one.
    console.warn(`[notify] ${channel} could not be reported:`, err);
  }
}
