// ─────────────────────────────────────────────
// SkillSnap — Jobs Done Trust System Service
// Integration point: swap for verification API
// Both parties confirm via chat → count increments
// ─────────────────────────────────────────────
import type { JobRecord } from "@/types";

const MOCK_JOBS: JobRecord[] = [
  {
    id: "job_1",
    skillerId: "user_me",
    clientId: "user_jordan",
    description: "Skin fade + beard shape",
    verifiedAt: "2026-04-10T11:00:00Z",
  },
  {
    id: "job_2",
    skillerId: "user_me",
    clientId: "user_jordan",
    description: "Fresh fade — weekly client",
    verifiedAt: "2026-04-17T10:30:00Z",
  },
];

export const jobsDoneService = {
  async getJobsForUser(userId: string): Promise<JobRecord[]> {
    // TODO: GET /users/:id/jobs-done
    return MOCK_JOBS.filter((j) => j.skillerId === userId);
  },

  async requestVerification(_threadId: string): Promise<void> {
    // TODO: POST /jobs/request { threadId }
    // Sends verification prompt to both chat participants
  },

  async confirmJob(_jobId: string): Promise<void> {
    // TODO: POST /jobs/:id/confirm
    // When both confirm → increment jobsDone on skiller profile
  },

  async getJobCount(userId: string): Promise<number> {
    // TODO: GET /users/:id/jobs-done/count
    const jobs = await jobsDoneService.getJobsForUser(userId);
    return jobs.length;
  },
};
