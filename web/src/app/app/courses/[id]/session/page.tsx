"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { StateBadge } from "@/components/ui/state-badge";
import { buildSessionPack, getCourse } from "@/lib/mock-data";
import type { SessionPackItem } from "@/lib/types";

export default function SessionPage() {
  const params = useParams();
  const courseId = String(params.id);
  const course = getCourse(courseId);
  const initialPack = useMemo(
    () => (course ? buildSessionPack(course, course.sessionDefaultMinutes) : []),
    [course],
  );
  const [queue, setQueue] = useState<SessionPackItem[]>(initialPack);
  const [skips, setSkips] = useState(0);
  const [deferred, setDeferred] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  if (!course) {
    return (
      <AppShell>
        <p className="p-8">Course not found.</p>
      </AppShell>
    );
  }

  const current = queue[0];
  const lesson = current ? course.lessons[current.lessonId] : null;
  const skipDisabled = skips >= 2;

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
          <h1 className="text-[28px] font-semibold">Session complete</h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Skips used: <span className="tabular">{skips}/2</span>
            {deferred.length > 0 && (
              <>
                {" "}
                · {deferred.length} deferred until tomorrow
              </>
            )}
          </p>
          <Link
            href={`/app/courses/${course.id}`}
            className="mt-8 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)]"
          >
            Back to atlas
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell courseId={course.id} courseTitle={course.title}>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr] md:px-6">
        <aside className="surface-card p-4">
          <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Queue
          </p>
          <ul className="mt-3 space-y-2">
            {queue.map((item, i) => {
              const l = course.lessons[item.lessonId];
              return (
                <li
                  key={item.lessonId}
                  className={
                    i === 0
                      ? "rounded-[var(--radius-md)] bg-[var(--surface-2)] px-2 py-2 text-[13px]"
                      : "px-2 py-1.5 text-[13px] text-[var(--text-secondary)]"
                  }
                >
                  <span className="text-[11px] uppercase text-[var(--text-tertiary)]">
                    {item.kind}
                  </span>
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {l?.title}
                  </p>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="surface-card flex flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge status={lesson.status} />
            <span className="tabular text-[12px] text-[var(--text-tertiary)]">
              {lesson.estMinutes} min
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              Skips {skips}/2
            </span>
          </div>
          <h1 className="mt-3 text-[24px] font-semibold">{lesson.title}</h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Open the lesson, then complete the quiz to count as done. Skip defers
            +1 day (max 2 per pack).
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/app/courses/${course.id}/lessons/${lesson.id}`}
              className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)]"
            >
              Open lesson
            </Link>
            <Link
              href={`/app/courses/${course.id}/lessons/${lesson.id}/quiz`}
              className="inline-flex h-10 items-center rounded-full border border-[var(--hairline)] px-5 text-[14px]"
            >
              Jump to quiz
            </Link>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-6">
            <Button
              variant="ghost"
              disabled={skipDisabled}
              onClick={skip}
              title={skipDisabled ? "Defer limit for this pack" : "Defer until tomorrow"}
            >
              {skipDisabled ? "Defer limit for this pack" : "Skip · defer +1 day"}
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
