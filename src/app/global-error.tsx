"use client";

import ErrorReporter from "@/components/ErrorReporter";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorReporter error={error} reset={reset} />;
}
