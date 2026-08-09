"use client";
// ─────────────────────────────────────────────
// Public profile — Connect button
// Hands off to the SPA via /?connect=<userId>. AppState picks the param up and
// either opens the chat (logged in) or shows the auth prompt and resumes the
// connect once the user signs in.
// ─────────────────────────────────────────────
import { useState } from "react";
import ConnectButton from "@/components/skillsnap/shared/ConnectButton";

export default function ConnectAction({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <ConnectButton
      fullWidth
      loading={loading}
      onClick={() => {
        setLoading(true);
        window.location.href = `/?connect=${encodeURIComponent(userId)}`;
      }}
    />
  );
}
