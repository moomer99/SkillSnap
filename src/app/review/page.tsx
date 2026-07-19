// ─────────────────────────────────────────────
// SkillSnap — Review Mode (Server Component)
// Validates ?token= against REVIEW_MODE_TOKEN env var.
// Returns 404 for invalid/missing tokens.
// ─────────────────────────────────────────────
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReviewAppShell from "./ReviewAppShell";

export const metadata: Metadata = {
  title: "Review — SkillSnap",
  description: "SkillSnap preview mode — sample data only",
  robots: { index: false, follow: false },
};

export default function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Resolve the promise
  const params = searchParams;

  // Use a synchronous function approach since params is a promise
  // We'll use a simpler approach
  return <ReviewPageInner searchParams={searchParams} />;
}

async function ReviewPageInner({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const validToken = process.env.REVIEW_MODE_TOKEN;

  if (!validToken || token !== validToken) {
    notFound();
  }

  return <ReviewAppShell />;
}