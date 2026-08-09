// ─────────────────────────────────────────────
// SkillSnap — sharing helpers
// Everything shareable points at the public profile (/@username), never the
// bare homepage — that page is the sharing surface people land on.
// ─────────────────────────────────────────────
import { profileUrl } from "@/constants/config";

export type ShareResult = "shared" | "copied" | "cancelled" | "unavailable";

interface ShareProfileArgs {
  username: string | null | undefined;
  displayName?: string | null;
  /** Overrides the default share text. */
  text?: string;
}

/**
 * Opens the native share sheet for a pro's public profile, falling back to
 * copying the link. Returns what actually happened so callers can toast.
 */
export async function shareProfile({ username, displayName, text }: ShareProfileArgs): Promise<ShareResult> {
  if (!username) return "unavailable";

  const url = profileUrl(username);
  const name = displayName?.trim() || `@${username}`;
  const shareText = text ?? `Check out ${name} on SkillSnap — watch their real work.`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "SkillSnap", text: shareText, url });
      return "shared";
    } catch {
      // User dismissed the sheet, or the browser rejected the payload —
      // fall through to the clipboard so the action still does something.
    }
  }

  try {
    await navigator.clipboard?.writeText(url);
    return "copied";
  } catch {
    return "unavailable";
  }
}
