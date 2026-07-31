"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { applyMotionAttr, readPrefs } from "@/lib/prefs";

export function AppShell({
  children,
  courseTitle,
  courseId,
  activeNav,
  settingsActive,
  className,
}: {
  children: React.ReactNode;
  courseTitle?: string;
  courseId?: string;
  activeNav?: "atlas" | "sources" | "insights" | "confirm";
  settingsActive?: boolean;
  className?: string;
}) {
  useEffect(() => {
    applyMotionAttr(readPrefs().motion);
  }, []);

  const courseLinks = courseId
    ? ([
        ["atlas", "Atlas", `/app/courses/${courseId}`],
        ["sources", "Sources", `/app/courses/${courseId}/sources`],
        ["insights", "Insights", `/app/courses/${courseId}/insights`],
      ] as const)
    : [];

  return (
    <div className={cn("flex min-h-full flex-col bg-[var(--canvas)]", className)}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[var(--z-toast)] focus:rounded-[var(--radius-md)] focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-[var(--text-invert)]"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-[var(--z-raised)] border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/app"
              className="shrink-0 text-[15px] font-semibold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-90"
            >
              Guided<span className="text-[var(--accent)]">Learning</span>
            </Link>
            {courseTitle && courseId && (
              <>
                <span className="text-[var(--text-tertiary)]" aria-hidden>
                  /
                </span>
                <Link
                  href={`/app/courses/${courseId}`}
                  className="truncate text-[14px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {courseTitle}
                </Link>
              </>
            )}
          </div>

          {courseId && (
            <nav
              className="hidden items-center gap-1 sm:flex"
              aria-label="Course"
            >
              {courseLinks.map(([key, label, href]) => (
                <Link
                  key={key}
                  href={href}
                  aria-current={activeNav === key ? "page" : undefined}
                  className={cn(
                    "rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] transition-colors",
                    activeNav === key
                      ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/app/courses/new"
              className="hidden text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)] sm:inline"
            >
              New course
            </Link>
            <Link
              href="/app/courses/new"
              className="inline text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)] sm:hidden"
              aria-label="New course"
            >
              New
            </Link>
            <Link
              href="/app/settings"
              aria-current={settingsActive ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors",
                settingsActive
                  ? "border-[var(--accent)]/40 bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "border-[var(--hairline)] text-[var(--text-secondary)] hover:border-[var(--hairline-strong)] hover:text-[var(--text-primary)]",
              )}
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className={cn("flex-1", courseId && "pb-16 sm:pb-0")}>
        {children}
      </main>

      {courseId && (
        <nav
          className="fixed inset-x-0 bottom-0 z-[var(--z-raised)] border-t border-[var(--hairline)] bg-[var(--canvas)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
          aria-label="Course mobile"
        >
          <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-2">
            {courseLinks.map(([key, label, href]) => (
              <Link
                key={key}
                href={href}
                aria-current={activeNav === key ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center text-[12px] font-medium transition-colors",
                  activeNav === key
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]",
                )}
              >
                {label}
                {activeNav === key && (
                  <span
                    className="absolute inset-x-6 bottom-1.5 h-0.5 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
