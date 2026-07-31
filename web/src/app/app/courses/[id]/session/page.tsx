"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { StateBadge } from "@/components/ui/state-badge";
import { buildSessionPack, getCourse } from "@/lib/mock-data";
import type { SessionPackItem } from "@/lib/types";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.id);
  const course = getCourse(courseId);
  // Prefer a full pack for the runner so skip-cap (2) is reachable with queue left.
  const initialPack = useMemo(
    () =>
      course
        ? buildSessionPack(
            course,
            Math.max(course.sessionDefaultMinutes, 45),
          )
        : [],
    [course],
  );
  const [queue, setQueue] = useState<SessionPackItem[]>(initialPack);
  const [skips, setSkips] = useState(0);
  const [deferred, setDeferred] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const current = queue[0];
  const lesson = current && course ? course.lessons[current.lessonId] : null;
  const skipDisabled = skips >= 2;

  useEffect(() => {
    if (done || !course || !current || !lesson) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        router.push(
          `/app/courses/${course!.id}/lessons/${current!.lessonId}`,
        );
      }
      if ((e.key === "j" || e.key === "J") && lesson?.quizReady) {
        e.preventDefault();
        router.push(
          `/app/courses/${course!.id}/lessons/${current!.lessonId}/quiz`,
        );
      }
      if ((e.key === "k" || e.key === "K") && !skipDisabled) {
        e.preventDefault();
        setSkips((s) => s + 1);
        setDeferred((d) => [...d, current!.lessonId]);
        setQueue((q) => {
          const next = q.slice(1);
          if (next.length === 0) setDone(true);
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, course, current, lesson, skipDisabled, router]);

  if (!course) {
    return (
      <AppShell>
        <p className="p-8">Course not found.</p>
      </AppShell>
    );
  }

  function skip() {
    if (!current || skipDisabled) return;
    setSkips((s) => s + 1);
    setDeferred((d) => [...d, current.lessonId]);
    setQueue((q) => q.slice(1));
    if (queue.length <= 1) setDone(true);
  }

  if (done || !current || !lesson) {
    return (
      <AppShell courseId={course.id} courseTitle={course.title}>
        <div className="mx-auto max-w-lg px-4 py-16">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
            Pack finished
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
            Session complete
          </h1>
          <div className="mt-6 space-y-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
            <div className="flex justify-between text-[14px]">
              <span className="text-[var(--text-secondary)]">Pack steps</span>
              <span className="tabular font-medium">
                {initialPack.length - deferred.length}/{initialPack.length}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--hairline)] pt-3 text-[14px]">
              <span className="text-[var(--text-secondary)]">Skips used</span>
              <span className="tabular font-medium">{skips}/2</span>
            </div>
            {deferred.length > 0 && (
              <div className="flex justify-between border-t border-[var(--hairline)] pt-3 text-[14px]">
                <span className="text-[var(--text-secondary)]">Deferred</span>
                <span className="tabular font-medium text-[var(--state-deferred)]">
                  {deferred.length} until tomorrow
                </span>
              </div>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/app/courses/${course.id}`} className="cta-primary">
              Back to atlas
            </Link>
            <Link
              href={`/app/courses/${course.id}/insights`}
              className="cta-secondary text-[14px] text-[var(--text-primary)]"
            >
              View insights
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell courseId={course.id} courseTitle={course.title}>
      <div className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-5xl gap-4 px-4 py-6 sm:gap-6 sm:py-8 lg:grid-cols-[240px_1fr] md:px-6">
        <aside className="surface-card h-fit overflow-x-auto p-4 lg:sticky lg:top-20">
          <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
            Queue ·{" "}
            <span className="tabular text-[var(--text-secondary)]">
              {queue.length}
            </span>{" "}
            left ·{" "}
            <span className="tabular">
              {initialPack.length - queue.length + 1}/{initialPack.length}
            </span>
          </p>
          <ul className="mt-3 flex gap-2 lg:flex-col lg:space-y-1.5 lg:gap-0">
            {queue.map((item, i) => {
              const l = course.lessons[item.lessonId];
              return (
                <li
                  key={item.lessonId}
                  className={
                    i === 0
                      ? "flex min-w-[9.5rem] shrink-0 gap-2.5 rounded-[var(--radius-md)] border border-[var(--accent)]/25 bg-[var(--accent-muted)] px-2.5 py-2 text-[13px] lg:min-w-0"
                      : "flex min-w-[9.5rem] shrink-0 gap-2.5 rounded-[var(--radius-md)] border border-transparent px-2.5 py-1.5 text-[13px] text-[var(--text-secondary)] lg:min-w-0"
                  }
                >
                  <span
                    className={
                      i === 0
                        ? "tabular mt-0.5 shrink-0 text-[11px] font-medium text-[var(--accent)]"
                        : "tabular mt-0.5 shrink-0 text-[11px] text-[var(--text-tertiary)]"
                    }
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[11px] capitalize text-[var(--text-tertiary)]">
                      {item.kind}
                    </span>
                    <p className="truncate font-medium text-[var(--text-primary)]">
                      {l?.title}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="surface-card flex flex-col p-6 md:p-8">
          <div
            className="mb-5 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={initialPack.length}
            aria-valuenow={initialPack.length - queue.length}
            aria-label="Session progress"
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-[var(--duration-med)] ease-[var(--ease-out-soft)]"
              style={{
                width: `${
                  initialPack.length
                    ? ((initialPack.length - queue.length) /
                        initialPack.length) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge status={lesson.status} />
            <span className="tabular text-[12px] text-[var(--text-tertiary)]">
              {lesson.estMinutes} min
            </span>
            <span className="tabular text-[12px] text-[var(--text-tertiary)]">
              Skips {skips}/2
            </span>
            <span className="tabular text-[12px] text-[var(--text-tertiary)]">
              {initialPack.length - queue.length + 1}/{initialPack.length}
            </span>
          </div>
          <h1 className="mt-3 text-[24px] font-semibold tracking-tight md:text-[28px]">
            {lesson.title}
          </h1>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Open the lesson, then complete the quiz to count as done. Skip defers
            +1 day (max 2 per pack).
          </p>
          <ul className="mt-5 list-disc space-y-1 pl-5 text-[14px] text-[var(--text-secondary)]">
            {lesson.objectives.slice(0, 3).map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/app/courses/${course.id}/lessons/${lesson.id}`}
              className="cta-primary"
            >
              Open lesson
            </Link>
            <Link
              href={`/app/courses/${course.id}/lessons/${lesson.id}/quiz`}
              className="cta-secondary text-[14px] text-[var(--text-primary)]"
            >
              Jump to quiz
            </Link>
            <span className="hidden text-[11px] text-[var(--text-tertiary)] sm:inline">
              <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                Enter
              </kbd>{" "}
              open ·{" "}
              <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                J
              </kbd>{" "}
              quiz ·{" "}
              <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                K
              </kbd>{" "}
              skip
            </span>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-5">
            <Button
              variant="ghost"
              disabled={skipDisabled}
              onClick={skip}
              title={
                skipDisabled
                  ? "Defer limit for this pack"
                  : "Defer until tomorrow"
              }
            >
              {skipDisabled
                ? "Defer limit for this pack"
                : "Skip · defer +1 day"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setQueue((q) => q.slice(1));
                  if (queue.length <= 1) setDone(true);
                }}
              >
                Mark pack step done
              </Button>
              <Button variant="ghost" onClick={() => setDone(true)}>
                End session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
