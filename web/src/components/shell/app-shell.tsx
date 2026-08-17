"use client";

// Floating island chrome for the desk.

import { useEffect } from "react";
import Link from "next/link";
import {
  Books,
  ChartLineUp,
  GearSix,
  House,
  Plus,
} from "@phosphor-icons/react";
import { Wordmark } from "@/components/ui/cta-link";
import { cn } from "@/lib/cn";
import { applyPrefsAttrs, readPrefs } from "@/lib/prefs";

export type CourseNavKey = "today" | "sources" | "progress" | "confirm";

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
  activeNav?: CourseNavKey;
  settingsActive?: boolean;
  className?: string;
}) {
  useEffect(() => {
    applyPrefsAttrs(readPrefs());
  }, []);

  const courseLinks = courseId
    ? ([
        ["today", "Today", `/app/courses/${courseId}`, House],
        ["sources", "Sources", `/app/courses/${courseId}/sources`, Books],
        [
          "progress",
          "Progress",
          `/app/courses/${courseId}/insights`,
          ChartLineUp,
        ],
      ] as const)
    : [];

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col bg-[var(--canvas)]",
        className,
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-[var(--text-invert)]"
      >
        Skip to content
      </a>

      <div className="sticky top-0 z-[var(--z-raised)] px-3 pt-3 md:px-5 md:pt-4">
        <header className="island mx-auto flex h-14 max-w-[1120px] items-center gap-2 rounded-full px-2 pl-4">
          <Wordmark href="/app" />
          {courseTitle && courseId ? (
            <>
              <span
                className="hidden text-[var(--text-tertiary)] sm:inline"
                aria-hidden
              >
                /
              </span>
              <Link
                href={`/app/courses/${courseId}`}
                className="hidden min-w-0 truncate text-[13px] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:text-[var(--text-primary)] sm:inline"
              >
                {courseTitle}
              </Link>
            </>
          ) : null}

          {courseId ? (
            <nav
              className="ml-2 hidden items-center gap-0.5 sm:flex"
              aria-label="Course"
            >
              {courseLinks.map(([key, label, href]) => (
                <Link
                  key={key}
                  href={href}
                  aria-current={activeNav === key ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
                    activeNav === key
                      ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Link
              href="/app/courses/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">New</span>
            </Link>
            <Link
              href="/app/settings"
              aria-current={settingsActive ? "page" : undefined}
              aria-label="Settings"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
                settingsActive
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
              )}
            >
              <GearSix size={16} weight="light" />
            </Link>
          </div>
        </header>
      </div>

      <main
        id="main"
        className={cn("flex-1", courseId && "pb-24 sm:pb-8")}
      >
        {children}
      </main>

      {courseId ? (
        <nav
          className="fixed inset-x-3 bottom-3 z-[var(--z-raised)] pb-[env(safe-area-inset-bottom)] sm:hidden"
          aria-label="Course"
        >
          <div className="island flex h-14 items-center justify-around rounded-full px-2">
            {courseLinks.map(([key, label, href, Icon]) => (
              <Link
                key={key}
                href={href}
                aria-current={activeNav === key ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] active:scale-[0.98]",
                  activeNav === key
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]",
                )}
              >
                <Icon
                  size={18}
                  weight={activeNav === key ? "regular" : "light"}
                />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
