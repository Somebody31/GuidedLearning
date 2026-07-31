import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { getActiveCourse, listCourses } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Library",
};

export default function AppHomePage() {
  const courses = listCourses();
  const active = getActiveCourse();
  const dueCount = Object.values(active.lessons).filter(
    (l) => l.status === "due",
  ).length;
  const weakCount = Object.values(active.lessons).filter(
    (l) => l.status === "weak",
  ).length;
  const libraryDue = courses.reduce(
    (n, c) =>
      n + Object.values(c.lessons).filter((l) => l.status === "due").length,
    0,
  );
  const mastered = Object.values(active.lessons).filter(
    (l) => l.status === "mastered",
  ).length;
  const total = Object.keys(active.lessons).length;
  const progress = total ? mastered / total : 0;
  const packReady = dueCount + weakCount > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="text-[28px] font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
          Active = most recently studied ·{" "}
          <span className="tabular">{libraryDue}</span> due across library
        </p>

        <section
          className="mt-8 rounded-[var(--radius-xl)] border border-[var(--accent)]/30 bg-[var(--surface-1)] p-6 shadow-[0_0_0_1px_var(--accent-muted)] transition-shadow duration-[var(--duration-med)] hover:shadow-[0_0_0_1px_var(--accent-muted),var(--shadow-card)]"
          aria-labelledby="continue-heading"
        >
          <p
            id="continue-heading"
            className="text-[12px] font-medium text-[var(--accent)]"
          >
            Continue
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight">
                {active.title}
              </h2>
              <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
                <span className="tabular text-[var(--state-due)]">{dueCount}</span>{" "}
                due
                {weakCount > 0 && (
                  <>
                    {" · "}
                    <span className="tabular text-[var(--state-weak)]">
                      {weakCount}
                    </span>{" "}
                    weak
                  </>
                )}
                {" · "}
                <span className="tabular">{mastered}</span>/{total} mastered
                {packReady ? " · pack ready" : " · nothing due"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <MasteryRing value={progress} size={40} />
              {packReady ? (
                <Link
                  href={`/app/courses/${active.id}/session`}
                  className="cta-primary"
                >
                  Start session
                </Link>
              ) : null}
              <Link
                href={`/app/courses/${active.id}`}
                className={packReady ? "cta-secondary" : "cta-primary"}
              >
                Open atlas
              </Link>
              <Link
                href={`/app/courses/${active.id}/diagnostic`}
                className="cta-secondary"
              >
                Diagnostic
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-medium">Courses</h2>
            <Link
              href="/app/courses/new"
              className="text-[13px] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] hover:underline"
            >
              New course
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => {
              const due = Object.values(c.lessons).filter(
                (l) => l.status === "due",
              ).length;
              const m = Object.values(c.lessons).filter(
                (l) => l.status === "mastered",
              ).length;
              const t = Object.keys(c.lessons).length;
              const isActive = c.id === active.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/app/courses/${c.id}`}
                    className={
                      isActive
                        ? "group flex items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--accent)]/25 bg-[var(--surface-1)] p-4 shadow-[0_0_0_1px_var(--accent-muted)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-card)] active:scale-[0.995]"
                        : "group flex items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-card)] active:scale-[0.995]"
                    }
                  >
                    <MasteryRing value={t ? m / t : 0} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium transition-colors group-hover:text-[var(--text-primary)]">
                          {c.title}
                        </p>
                        {isActive ? (
                          <span className="shrink-0 rounded-full bg-[var(--accent-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[13px] text-[var(--text-tertiary)]">
                        <span className="tabular text-[var(--state-due)]">
                          {due}
                        </span>{" "}
                        due ·{" "}
                        {c.lifecycle === "activated" ? "Active path" : "Draft"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/app/courses/new"
                className="flex h-full min-h-[76px] items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--hairline-strong)] bg-transparent p-4 text-[14px] text-[var(--text-tertiary)] transition-all duration-[var(--duration-fast)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-muted)]/30 hover:text-[var(--accent)] active:scale-[0.995]"
              >
                + New course from PDFs
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
