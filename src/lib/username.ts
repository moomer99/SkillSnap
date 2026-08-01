// ─────────────────────────────────────────────
// Usernames are stored bare.
//
// This app used to write '@' || handle while the mobile app wrote the handle as
// typed, so profiles.username ended up holding three shapes at once and every
// exact-match lookup found only one of them — QR scanning, which does
// `.eq('username', handle)`, failed for most accounts.
//
// 20260801110000_normalise_usernames.sql in the app repo strips the column and
// adds a CHECK constraint, so writing an @ here now fails outright rather than
// quietly reintroducing the split.
//
// The @ is presentation. Add it when rendering, never when storing.
// Mirrored in src/utils/profileUrl.ts in the mobile repo — keep them in step.
// ─────────────────────────────────────────────

/** Storage form: no leading @, no surrounding whitespace. */
export function normaliseUsername(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^@+/, "").trim();
}

/** Display form: always leading-@, however the value happens to arrive. */
export function displayUsername(value: string | null | undefined): string {
  const bare = normaliseUsername(value);
  return bare ? `@${bare}` : "";
}
