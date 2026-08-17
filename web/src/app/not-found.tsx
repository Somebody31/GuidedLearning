// Unknown URL.

import Link from "next/link";
import { DEMO_COURSE_ID } from "@/lib/api";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        404
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="max-w-sm text-[14px] text-[var(--text-secondary)]">
        That route isn&apos;t part of the app. Head back to your library or the
        sample course.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link href="/app" className="cta-primary">
          Library
        </Link>
        <Link
          href={`/app/courses/${DEMO_COURSE_ID}`}
          className="cta-secondary text-[14px]"
        >
          Open sample course
        </Link>
        <Link href="/" className="text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]">
          Marketing
        </Link>
      </div>
    </div>
  );
}
