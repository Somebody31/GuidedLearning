import Link from "next/link";
import { CN_COURSE_ID } from "@/lib/mock-data";

export default function MarketingPage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(800px 400px at 70% 0%, rgba(45,212,191,0.08), transparent 55%)",
        }}
      />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-[15px] font-semibold tracking-tight">
          Guided<span className="text-[var(--accent)]">Learning</span>
        </span>
        <Link
          href="/app"
          className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          Open app
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col px-6 pb-24 pt-16 md:pt-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
          Atlas Noir · adaptive study
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl md:leading-[1.1]">
          From PDFs to a living course path.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--text-secondary)]">
          Upload textbooks and lecture slides. Confirm a unit → lesson map.
          Study grounded lessons, quiz for mastery, and let spaced review
          rewrite what&apos;s next — not a chatbot with a sidebar.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/app/courses/${CN_COURSE_ID}`}
            className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-6 text-[15px] font-medium text-[var(--text-invert)] hover:bg-[var(--accent-hover)]"
          >
            Open demo · Computer Networks
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center rounded-full border border-[var(--hairline)] px-6 text-[15px] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
          >
            Your library
          </Link>
        </div>

        <dl className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            ["Course shape", "Units and lessons on a spatial atlas"],
            ["Grounded lessons", "Citations back into your PDFs"],
            ["Adaptive memory", "Quiz → mastery · due · weak · deferred"],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5"
            >
              <dt className="text-[13px] font-medium text-[var(--accent)]">{t}</dt>
              <dd className="mt-2 text-[14px] text-[var(--text-secondary)]">{d}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
