// Landing. The desk starts at /app.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { CtaLink, Wordmark } from "@/components/ui/cta-link";
import { DEMO_COURSE_ID } from "@/lib/api";

export const metadata: Metadata = {
  title: "The next page is already marked",
  description:
    "Upload textbooks and lecture slides. Confirm the path. Sit down and study what is due today.",
};

export default function MarketingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-[var(--text-invert)]"
      >
        Skip to content
      </a>
      <div className="hero-wash pointer-events-none absolute inset-0" />

      <header className="relative z-10 px-4 pt-5 md:px-6">
        <div className="island animate-fade-up mx-auto flex h-14 max-w-[1120px] items-center justify-between rounded-full px-2 pl-5">
          <Wordmark href="/" />
          <nav className="flex items-center gap-1">
            <Link
              href={`/app/courses/${DEMO_COURSE_ID}`}
              className="hidden rounded-full px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:text-[var(--text-primary)] sm:inline"
            >
              Sample
            </Link>
            <CtaLink href="/app" variant="secondary" className="h-10 px-4">
              Open the desk
            </CtaLink>
          </nav>
        </div>
      </header>

      <main
        id="main"
        className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-24 pt-16 md:px-6 md:pt-24"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="animate-fade-up inline-flex rounded-full bg-[var(--accent-muted)] px-3 py-1 text-[11px] font-medium text-[var(--accent)]">
              Study desk
            </p>
            <h1 className="animate-fade-up mt-5 max-w-[14ch] text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)] md:text-[4.25rem] [animation-delay:80ms]">
              The next page is already marked.
            </h1>
            <p className="animate-fade-up mt-6 max-w-md text-[16px] leading-relaxed text-[var(--text-secondary)] [animation-delay:140ms]">
              Upload textbooks and lecture slides. Confirm the path. Sit down
              and study what is due today — grounded in your files, not a
              chatbot with a sidebar.
            </p>
            <div className="animate-fade-up mt-10 flex flex-wrap items-center gap-3 [animation-delay:200ms]">
              <CtaLink href="/app/courses/new" className="h-12 px-2 pl-5 text-[15px]">
                Start from your PDFs
              </CtaLink>
              <Link
                href="/app"
                className="inline-flex h-12 items-center px-2 text-[14px] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:text-[var(--text-primary)]"
              >
                Open the desk
              </Link>
            </div>
          </div>

          <div className="animate-fade-up relative hidden min-h-[22rem] lg:block [animation-delay:180ms]">
            <div className="plate-shell absolute inset-x-6 top-0 rotate-[-2deg]">
              <div className="plate-inner px-6 py-5">
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  Today
                </p>
                <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">
                  Computer Networks
                </p>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  One sitting · sample path
                </p>
              </div>
            </div>
            <div className="plate-shell absolute inset-x-0 top-24 rotate-[1.5deg] shadow-[var(--shadow-lift)]">
              <div className="plate-inner px-6 py-6">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-8 w-1 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[var(--accent)]">
                      Due today
                    </p>
                    <p className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">
                      HTTP
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                      Application · 14 min
                    </p>
                  </div>
                </div>
                <div className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-2 pl-4 text-[14px] font-semibold text-[var(--text-invert)]">
                  Start review
                  <span className="cta-icon" aria-hidden>
                    <ArrowUpRight size={15} weight="bold" />
                  </span>
                </div>
              </div>
            </div>
            <div className="plate-shell absolute inset-x-10 bottom-0 rotate-[-1deg]">
              <div className="plate-inner flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[13px] font-medium">TCP basics</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    Needs practice · then new
                  </p>
                </div>
                <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                  +2 in this sitting
                </p>
              </div>
            </div>
            <p className="absolute -bottom-8 right-2 text-[11px] text-[var(--text-tertiary)]">
              Sample sitting · not a live score
            </p>
          </div>
        </div>

        <section className="mt-28 grid gap-4 md:grid-cols-3 md:gap-5">
          {[
            [
              "Upload",
              "Textbooks, lecture slides, or notes. The path is built from your files.",
            ],
            [
              "Confirm",
              "Edit the unit and lesson titles. Tracking starts only when you say so.",
            ],
            [
              "Sit",
              "Read the marked page, take the quiz, then the next due item.",
            ],
          ].map(([title, body], i) => (
            <div
              key={title}
              className="animate-fade-up plate-shell"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <div className="plate-inner p-6">
                <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
                  {title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-24 flex flex-col gap-4 border-t border-[var(--hairline)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Any subject · your PDFs · sample course included
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[12px]">
            <Link
              href={`/app/courses/${DEMO_COURSE_ID}`}
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              Sample course
            </Link>
            <Link
              href="/app"
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              Desk
            </Link>
            <Link
              href="/app/settings"
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              Settings
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
