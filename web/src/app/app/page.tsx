// Home / library: list courses from the API (any subject).

import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { DEMO_COURSE_ID, listCourses } from "@/lib/api";
import type { CourseSummary } from "@/lib/types";

export const metadata: Metadata = {
  title: "Library",
};

export const dynamic = "force-dynamic";

function pickActive(courses: CourseSummary[]): CourseSummary | undefined {
  if (courses.length === 0) return undefined;
  let best = courses[0];
  for (const course of courses) {
    const a = best.lastStudiedAt ?? best.createdAt;
    const b = course.lastStudiedAt ?? course.createdAt;
    if (b > a) best = course;
  }
  return best;
}

function courseHref(course: CourseSummary) {
  if (course.lifecycle === "activated") return `/app/courses/${course.id}`;
  return `/app/courses/${course.id}/confirm`;
}

export default async function AppHomePage() {
  let courses: CourseSummary[] = [];
  let apiError = "";
  try {
    courses = await listCourses();
  } catch {
    apiError =
      "Could not reach the API at localhost:8787. Start the server, then refresh.";
  }

  const active = pickActive(courses);
  const total = active?.lessonCount ?? 0;
  const dueCount = active?.dueCount ?? 0;
  const weakCount = active?.weakCount ?? 0;
  const mastered = active?.masteredCount ?? 0;
  const progress = total ? mastered / total : 0;
  const packReady = dueCount + weakCount > 0;

  let libraryDue = 0;
  for (const course of courses) {
    libraryDue += course.dueCount;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="text-[28px] font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
          Any subject from PDFs ·{" "}
          <span className="tabular">{libraryDue}</span> due across library
        </p>

        {apiError ? (
          <p
            className="mt-6 rounded-[var(--radius-lg)] border border-[var(--warning)]/30 bg-[rgba(251,191,36,0.08)] px-4 py-3 text-[13px] text-[var(--warning)]"
            role="alert"
          >
            {apiError}
          </p>
        ) : null}

        {active ? (
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
                  <span className="tabular text-[var(--state-due)]">
                    {dueCount}
                  </span>{" "}
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
                {packReady && active.lifecycle === "activated" ? (
                  <Link
                    href={`/app/courses/${active.id}/session`}
                    className="cta-primary"
                  >
                    Start session
                  </Link>
                ) : null}
                <Link
                  href={courseHref(active)}
                  className={
                    packReady && active.lifecycle === "activated"
                      ? "cta-secondary"
                      : "cta-primary"
                  }
                >
                  {active.lifecycle === "activated"
                    ? "Open atlas"
                    : "Confirm map"}
                </Link>
                {active.lifecycle === "activated" ? (
                  <Link
                    href={`/app/courses/${active.id}/diagnostic`}
                    className="cta-secondary"
                  >
                    Diagnostic
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : !apiError ? (
          <section className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-0)] px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-[var(--text-secondary)]">
              No courses yet
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              Upload textbooks or lecture slides for any subject.
            </p>
            <Link href="/app/courses/new" className="cta-primary mt-5">
              New course from PDFs
            </Link>
          </section>
        ) : null}

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
              const t = c.lessonCount;
              const isActive = active ? c.id === active.id : false;
              return (
                <li key={c.id}>
                  <Link
                    href={courseHref(c)}
                    className={
                      isActive
                        ? "group flex items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--accent)]/25 bg-[var(--surface-1)] p-4 shadow-[0_0_0_1px_var(--accent-muted)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-card)] active:scale-[0.995]"
                        : "group flex items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-card)] active:scale-[0.995]"
                    }
                  >
                    <MasteryRing value={t ? c.masteredCount / t : 0} size={36} />
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
                        {c.id === DEMO_COURSE_ID ? (
                          <span className="shrink-0 rounded-full border border-[var(--hairline)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                            Sample
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[13px] text-[var(--text-tertiary)]">
                        <span className="tabular text-[var(--state-due)]">
                          {c.dueCount}
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
