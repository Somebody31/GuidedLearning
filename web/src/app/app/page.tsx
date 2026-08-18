// Desk: pick up today's work.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { AppShell } from "@/components/shell/app-shell";
import { CtaLink } from "@/components/ui/cta-link";
import { DeskPage, Plate } from "@/components/ui/plate";
import { DEMO_COURSE_ID, listCourses } from "@/lib/api";
import { courseHomeHref } from "@/lib/next-action";
import type { CourseSummary } from "@/lib/types";

export const metadata: Metadata = {
  title: "Desk",
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

function continueLabel(course: CourseSummary) {
  if (course.lifecycle !== "activated") return "Review the path";
  if (course.dueCount > 0) return "Open today";
  return "Continue";
}

export default async function AppHomePage() {
  let courses: CourseSummary[] = [];
  let apiError = "";
  try {
    courses = await listCourses();
  } catch {
    apiError = "Could not reach the API. Start the server, then refresh.";
  }

  const active = pickActive(courses);
  let libraryDue = 0;
  let libraryPractice = 0;
  for (const course of courses) {
    libraryDue += course.dueCount;
    libraryPractice += course.weakCount;
  }

  return (
    <AppShell>
      <DeskPage>
        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] md:text-[2.5rem]">
          Desk
        </h1>
        <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
          {courses.length === 0
            ? "Sit down. The next page will be marked here."
            : libraryDue > 0
              ? `${libraryDue} due across your courses.`
              : libraryPractice > 0
                ? `${libraryPractice} topic${libraryPractice === 1 ? "" : "s"} to practice.`
                : "Nothing is waiting. Continue the path when you are ready."}
        </p>

        {apiError ? (
          <p
            className="mt-6 rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface-1))] px-4 py-3 text-[13px] text-[var(--warning)]"
            role="alert"
          >
            {apiError}
          </p>
        ) : null}

        {active ? (
          <Link
            href={courseHomeHref(active)}
            className="group mt-8 block"
            aria-labelledby="continue-heading"
          >
            <Plate className="transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
              <p
                id="continue-heading"
                className="text-[12px] font-medium text-[var(--accent)]"
              >
                Continue
              </p>
              <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-[1.75rem] font-semibold tracking-[-0.025em]">
                    {active.title}
                  </h2>
                  <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                    {active.lifecycle !== "activated" ? (
                      "Draft · confirm the path to start tracking"
                    ) : (
                      <>
                        <span className="tabular text-[var(--state-due)]">
                          {active.dueCount}
                        </span>{" "}
                        due
                        {active.weakCount > 0 ? (
                          <>
                            {" · "}
                            <span className="tabular text-[var(--state-weak)]">
                              {active.weakCount}
                            </span>{" "}
                            to practice
                          </>
                        ) : null}
                        {" · "}
                        <span className="tabular">{active.masteredCount}</span>/
                        {active.lessonCount} mastered
                      </>
                    )}
                  </p>
                </div>
                <span className="cta-primary pointer-events-none">
                  <span>{continueLabel(active)}</span>
                  <span className="cta-icon" aria-hidden>
                    <ArrowUpRight size={15} weight="bold" />
                  </span>
                </span>
              </div>
            </Plate>
          </Link>
        ) : !apiError ? (
          <Plate className="mt-8" innerClassName="px-6 py-12 text-center md:py-16">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
              Nothing on the desk yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] text-[var(--text-secondary)]">
              Upload a textbook, lecture slides, or a folder of code. We will
              draft a path you can confirm, then mark what to study today.
            </p>
            <CtaLink href="/app/courses/new" className="mt-6">
              New course
            </CtaLink>
          </Plate>
        ) : null}

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
              On this desk
            </h2>
            <Link
              href="/app/courses/new"
              className="text-[13px] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              New course
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => {
              const isActive = active ? c.id === active.id : false;
              return (
                <li key={c.id}>
                  <Link
                    href={courseHomeHref(c)}
                    className="group block h-full"
                  >
                    <Plate
                      className={
                        isActive
                          ? "h-full transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5"
                          : "h-full transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5"
                      }
                      innerClassName="flex h-full items-center gap-4 p-4 md:p-5"
                    >
                      <div
                        className="h-10 w-1 shrink-0 rounded-full"
                        style={{
                          background: isActive
                            ? "var(--accent)"
                            : "var(--surface-3)",
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[15px] font-semibold tracking-[-0.015em]">
                            {c.title}
                          </p>
                          {c.id === DEMO_COURSE_ID ? (
                            <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                              Sample
                            </span>
                          ) : null}
                          {c.kind === "code" ? (
                            <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                              Code
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
                          {c.lifecycle === "activated" ? (
                            <>
                              <span className="tabular text-[var(--state-due)]">
                                {c.dueCount}
                              </span>{" "}
                              due
                            </>
                          ) : (
                            "Draft"
                          )}
                        </p>
                      </div>
                    </Plate>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/app/courses/new" className="block h-full min-h-[88px]">
                <div className="flex h-full min-h-[88px] items-center justify-center rounded-[var(--radius-2xl)] border border-dashed border-[var(--hairline-strong)] px-4 text-[14px] text-[var(--text-tertiary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">
                  New course
                </div>
              </Link>
            </li>
          </ul>
        </section>
      </DeskPage>
    </AppShell>
  );
}
