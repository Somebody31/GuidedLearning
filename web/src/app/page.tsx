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
            className="cta-primary h-11 px-6 text-[15px] hover:shadow-[0_0_24px_rgba(45,212,191,0.25)]"
          >
            Open demo · Computer Networks
          </Link>
          <Link
            href="/app"
            className="cta-secondary h-11 px-6 text-[15px] text-[var(--text-primary)]"
          >
            Your library
          </Link>
        </div>

        <ol className="animate-fade-up mt-16 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0 [animation-delay:260ms]">
          {[
            ["01", "Upload", "PDFs of textbooks & lectures"],
            ["02", "Confirm", "Unit → lesson map you own"],
            ["03", "Study", "Quiz, review, adaptive pack"],
          ].map(([n, t, d], i) => (
            <li
              key={n}
              className="relative flex flex-1 items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-0)]/60 px-4 py-3 sm:rounded-none sm:border-y sm:border-r-0 sm:border-l sm:first:rounded-l-[var(--radius-lg)] sm:last:rounded-r-[var(--radius-lg)] sm:last:border-r"
            >
              <span className="tabular text-[12px] font-medium text-[var(--accent)]">
                {n}
              </span>
              <div>
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {t}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                  {d}
                </p>
              </div>
              {i < 2 && (
                <span
                  className="pointer-events-none absolute -right-1.5 top-1/2 hidden h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-[var(--hairline)] bg-[var(--surface-0)] sm:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>

        <dl className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            ["Course shape", "Units and lessons on a spatial atlas"],
            ["Grounded lessons", "Citations back into your PDFs"],
            ["Adaptive memory", "Quiz → mastery · due · weak · deferred"],
          ].map(([t, d], i) => (
            <div
              key={t}
              className="animate-fade-up group rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5 transition-all duration-[var(--duration-med)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-[var(--accent)]/25 hover:bg-[var(--surface-2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              style={{ animationDelay: `${340 + i * 70}ms` }}
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
