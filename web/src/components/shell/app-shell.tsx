import Link from "next/link";
import { cn } from "@/lib/cn";

export function AppShell({
  children,
  courseTitle,
  courseId,
  activeNav,
  className,
}: {
  children: React.ReactNode;
  courseTitle?: string;
  courseId?: string;
  activeNav?: "atlas" | "sources" | "insights" | "confirm";
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-full flex-col bg-[var(--canvas)]", className)}>
      <header className="sticky top-0 z-[var(--z-raised)] border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/app"
              className="shrink-0 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]"
            >
              Guided<span className="text-[var(--accent)]">Learning</span>
            </Link>
            {courseTitle && courseId && (
              <>
                <span className="text-[var(--text-tertiary)]">/</span>
                <Link
                  href={`/app/courses/${courseId}`}
                  className="truncate text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {courseTitle}
                </Link>
              </>
            )}
          </div>

          {courseId && (
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Course">
              {(
                [
                  ["atlas", "Atlas", `/app/courses/${courseId}`],
                  ["sources", "Sources", `/app/courses/${courseId}/sources`],
                  ["insights", "Insights", `/app/courses/${courseId}/insights`],
                ] as const
              ).map(([key, label, href]) => (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] transition-colors",
                    activeNav === key
                      ? "text-[var(--text-primary)] bg-[var(--surface-2)]"
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
              className="hidden text-[13px] text-[var(--text-tertiary)] hover:text-[var(--accent)] sm:inline"
            >
              New course
            </Link>
            <Link
              href="/app/courses/new"
              className="inline text-[13px] text-[var(--text-tertiary)] hover:text-[var(--accent)] sm:hidden"
              aria-label="New course"
            >
              New
            </Link>
            <Link
              href="/app/settings"
              className="rounded-full border border-[var(--hairline)] px-3 py-1 text-[12px] text-[var(--text-secondary)]"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
