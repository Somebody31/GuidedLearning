"use client";

// Shown if a page in /app crashes.

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--danger)]">
        Something broke
      </p>
      <h1 className="text-[24px] font-semibold tracking-tight">
        Couldn&apos;t render this screen
      </h1>
      <p className="max-w-sm text-[14px] text-[var(--text-secondary)]">
        This screen hit an unexpected error. Retry, or head back to the desk.
      </p>
      {error.digest ? (
        <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
          Digest {error.digest}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Link href="/app" className="cta-secondary text-[14px]">
          Desk
        </Link>
      </div>
    </div>
  );
}
