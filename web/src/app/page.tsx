import type { Metadata } from "next";
import Link from "next/link";
import { CN_COURSE_ID } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "From PDFs to a living course path",
  description:
    "Upload textbooks and lecture slides. Confirm a unit → lesson map. Adaptive spaced review — not a chatbot with a sidebar.",
};

export default function MarketingPage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(800px 400px at 70% 0%, rgba(45,212,191,0.08), transparent 55%), radial-gradient(500px 300px at 15% 80%, rgba(56,189,248,0.04), transparent 50%)",
        }}
      />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6 animate-fade-up">
        <span className="text-[15px] font-semibold tracking-tight">
          Guided<span className="text-[var(--accent)]">Learning</span>
        </span>
        <Link
          href="/app"
          className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          Open app
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col px-6 pb-24 pt-16 md:pt-24">
        <p className="animate-fade-up text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)] [animation-delay:40ms]">
          Atlas Noir · adaptive study
        </p>
        <h1 className="animate-fade-up mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl md:leading-[1.1] [animation-delay:100ms]">
          From PDFs to a living course path.
        </h1>
        <p className="animate-fade-up mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--text-secondary)] [animation-delay:160ms]">
          Upload textbooks and lecture slides. Confirm a unit → lesson map.
          Study grounded lessons, quiz for mastery, and let spaced review
          rewrite what&apos;s next — not a chatbot with a sidebar.
        </p>
        <div className="animate-fade-up mt-10 flex flex-wrap gap-3 [animation-delay:220ms]">
          <Link
            href={`/app/courses/${CN_COURSE_ID}`}
            className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-6 text-[15px] font-medium text-[var(--text-invert)] transition-all duration-[var(--duration-fast)] hover:bg-[var(--accent-hover)] hover:shadow-[0_0_24px_rgba(45,212,191,0.25)] active:scale-[0.98]"
          >
            Open demo · Computer Networks
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center rounded-full border border-[var(--hairline)] px-6 text-[15px] text-[var(--text-primary)] transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
          >
            Your library
          </Link>
        </div>

        <dl className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            ["Course shape", "Units and lessons on a spatial atlas"],
            ["Grounded lessons", "Citations back into your PDFs"],
            ["Adaptive memory", "Quiz → mastery · due · weak · deferred"],
          ].map(([t, d], i) => (
            <div
              key={t}
              className="animate-fade-up group rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5 transition-all duration-[var(--duration-med)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-[var(--accent)]/25 hover:bg-[var(--surface-2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <dt className="text-[13px] font-medium text-[var(--accent)] transition-colors group-hover:text-[var(--accent-hover)]">
                {t}
              </dt>
              <dd className="mt-2 text-[14px] text-[var(--text-secondary)]">
                {d}
              </dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
