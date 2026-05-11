// ─────────────────────────────────────────────
// SkillSnap — Jobs Done Trust System (Supabase)
// Flow: skiller requests → client confirms → jobs_done increments
// via DB trigger (handle_job_confirmed)
// ─────────────────────────────────────────────
import { getSupabase, getAuthSupabase } from "@/lib/supabase";
import type { JobRecord } from "@/types";

function mapJob(row: Record<string, unknown>): JobRecord {
  return {
    id: row.id as string,
    skillerId: row.skiller_id as string,
    clientId: row.client_id as string,
    description: (row.description as string) ?? "",
    verifiedAt: (row.verified_at as string) ?? "",
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await getAuthSupabase().auth.getUser();
  return user?.id ?? null;
}

export async function insertJobsDoneNotification(
  clientId: string,
  skillerUserId: string,
  skillerName: string
): Promise<void> {
  await getAuthSupabase()
    .from("notifications")
    .insert({
      user_id: clientId,
      type: "jobs_done_request",
      from_user_id: skillerUserId,
      message: `${skillerName} requested a Jobs Done confirmation`,
      read: false,
    });
}

export const jobsDoneService = {
  async getJobsForUser(userId: string): Promise<JobRecord[]> {
    const { data } = await getSupabase()
      .from("jobs_done")
      .select("*")
      .eq("skiller_id", userId)
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false });
    return (data ?? []).map((row) => mapJob(row as Record<string, unknown>));
  },

  async getJobCount(userId: string): Promise<number> {
    // Fast path: read from profile (maintained by trigger)
    const { data } = await getSupabase()
      .from("profiles")
      .select("jobs_done")
      .eq("id", userId)
      .single();
    return Number(data?.jobs_done ?? 0);
  },

  // Skiller initiates — creates a pending job record tied to the conversation
  async requestVerification(conversationId: string, clientId: string, description?: string): Promise<string | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await getSupabase()
      .from("jobs_done")
      .insert({
        skiller_id: userId,
        client_id: clientId,
        conversation_id: conversationId,
        description: description ?? null,
        skiller_confirmed: true, // skiller confirms by initiating
      })
      .select("id")
      .single();

    if (error || !data) return null;
    return data.id;
  },

  // Client confirms their side — DB trigger increments jobs_done if both confirmed
  async confirmJob(jobId: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await getSupabase()
      .from("jobs_done")
      .update({ client_confirmed: true })
      .eq("id", jobId)
      .eq("client_id", userId);
  },

  // Client declines — delete the job row
  async declineJob(jobId: string): Promise<void> {
    await getAuthSupabase()
      .from("jobs_done")
      .delete()
      .eq("id", jobId);
  },

  // Mark a notification as read
  async markNotificationRead(notificationId: string): Promise<void> {
    await getAuthSupabase()
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
  },

  // Get pending (unconfirmed) job requests for current user as client
  async getPendingRequests(): Promise<{ jobId: string; skillerId: string; description: string }[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data } = await getSupabase()
      .from("jobs_done")
      .select("id, skiller_id, description")
      .eq("client_id", userId)
      .eq("skiller_confirmed", true)
      .eq("client_confirmed", false)
      .is("verified_at", null);

    return (data ?? []).map((r) => ({
      jobId: r.id,
      skillerId: r.skiller_id,
      description: r.description ?? "",
    }));
  },
};
