"use client";

// Course home: one next action, then the path.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListBullets, MapTrifold } from "@phosphor-icons/react";
import { CourseAtlas } from "@/components/atlas/course-atlas";
import { CurriculumList } from "@/components/atlas/curriculum-list";
import { CtaLink } from "@/components/ui/cta-link";
import { Plate } from "@/components/ui/plate";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StateBadge } from "@/components/ui/state-badge";
import { writePrefs, applyPrefsAttrs, readPrefs } from "@/lib/prefs";
import {
  nextMove,
  PACK_KIND_LABEL,
} from "@/lib/next-action";
import type { Course } from "@/lib/types";

export function CourseToday({ course }: { course: Course }) {
  const router = useRouter();
  const [budget, setBudget] = useState(course.sessionDefaultMinutes);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const p = readPrefs();
    applyPrefsAttrs(p);
    setBudget(p.sessionMinutes);
  }, []);

  const move = useMemo(() => nextMove(course, budget), [course, budget]);
  const currentId = move.lesson?.id ?? null;
  const showPlace =
    course.lifecycle === "activated" &&
    move.pack.every((item) => item.kind === "new" || item.kind === "resume");

  useEffect(() => {
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
      if (e.key === "m" || e.key === "M") {
        setShowMap((v) => !v);
      }
      if ((e.key === "s" || e.key === "S") && move.pack.length > 1) {
        e.preventDefault();
        router.push(`/app/courses/${course.id}/session`);
      }
      if (e.key === "Enter" && move.kind !== "clear") {
        e.preventDefault();
        router.push(move.href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [course.id, move, router]);

  function changeBudget(next: number) {
    setBudget(next);
    writePrefs({ sessionMinutes: next });
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-4 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em] md:text-[2.25rem]">
            {course.title}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            {course.lifecycle === "activated"
              ? "Today · one sitting, then stop"
              : "Draft · confirm the path before tracking starts"}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-12">
        <Plate className="lg:col-span-8" innerClassName="flex flex-col p-6 md:p-8">
          {move.lesson ? (
            <>
              <p className="text-[12px] font-medium text-[var(--accent)]">
                {move.hint}
              </p>
              {move.unitTitle ? (
                <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">
                  {move.unitTitle}
                </p>
              ) : null}
              <h2 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.025em] md:text-[2rem]">
                {move.lesson.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StateBadge status={move.lesson.status} />
                <span className="tabular text-[13px] text-[var(--text-tertiary)]">
                  {move.lesson.estMinutes} min
                </span>
              </div>
              {move.lesson.objectives.length > 0 ? (
                <ul className="mt-5 list-disc space-y-1 pl-5 text-[14px] text-[var(--text-secondary)]">
                  {move.lesson.objectives.slice(0, 3).map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <CtaLink href={move.href}>{move.label}</CtaLink>
                {move.pack.length > 1 ? (
                  <CtaLink
                    href={`/app/courses/${course.id}/session`}
                    variant="secondary"
                  >
                    Work the sitting
                  </CtaLink>
                ) : null}
              </div>
            </>
          ) : move.kind === "confirm" ? (
            <>
              <p className="text-[12px] font-medium text-[var(--accent)]">
                Draft
              </p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em]">
                Review the path first
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {move.hint}
              </p>
              <CtaLink href={move.href} className="mt-8">
                {move.label}
              </CtaLink>
            </>
          ) : (
            <>
              <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
                All clear
              </p>
              <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em]">
                Nothing is waiting
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {move.hint}
              </p>
            </>
          )}
          {showPlace ? (
            <p className="mt-6 text-[13px] text-[var(--text-tertiary)]">
              Already know some of this?{" "}
              <Link
                href={`/app/courses/${course.id}/diagnostic`}
                className="text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
              >
                Place yourself
              </Link>
              . It never auto-masters a topic.
            </p>
          ) : null}
        </Plate>

        <Plate className="lg:col-span-4" innerClassName="flex h-full flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium">This sitting</p>
            <span className="tabular text-[12px] text-[var(--text-tertiary)]">
              {budget} min
            </span>
          </div>
          <div className="mt-3">
            <SegmentedControl
              ariaLabel="Sitting length"
              value={String(budget)}
              onChange={(v) => changeBudget(Number(v))}
              options={[
                { value: "15", label: "15" },
                { value: "25", label: "25" },
                { value: "45", label: "45" },
                { value: "60", label: "60" },
              ]}
            />
          </div>
          {move.pack.length > 0 ? (
            <ol className="mt-4 space-y-1">
              {move.pack.map((item, i) => {
                const lesson = course.lessons[item.lessonId];
                if (!lesson) return null;
                const current = i === 0;
                return (
                  <li key={item.lessonId}>
                    <Link
                      href={`/app/courses/${course.id}/lessons/${lesson.id}`}
                      className={
                        current
                          ? "flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--accent-muted)] px-2 py-2"
                          : "flex items-start gap-2 rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-[var(--surface-2)]"
                      }
                    >
                      <span
                        className={
                          current
                            ? "tabular mt-0.5 w-4 shrink-0 text-[11px] font-medium text-[var(--accent)]"
                            : "tabular mt-0.5 w-4 shrink-0 text-[11px] text-[var(--text-tertiary)]"
                        }
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">
                          {lesson.title}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {PACK_KIND_LABEL[item.kind]}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              The queue fills from due reviews, then weak topics, then the next
              new lesson.
            </p>
          )}
        </Plate>
      </div>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
            Path
          </h2>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            aria-pressed={showMap}
          >
            {showMap ? (
              <ListBullets size={15} weight="light" />
            ) : (
              <MapTrifold size={15} weight="light" />
            )}
            {showMap ? "Show list" : "Show map"}
          </button>
        </div>
        {showMap ? (
          <div className="plate-shell">
            <div className="plate-inner h-[min(70dvh,640px)] overflow-hidden p-1.5">
              <CourseAtlas
                course={course}
                selectedId={currentId}
                onSelect={(id) => {
                  if (!id) return;
                  const lesson = course.lessons[id];
                  if (lesson && lesson.status !== "locked") {
                    router.push(`/app/courses/${course.id}/lessons/${id}`);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <Plate innerClassName="p-4 md:p-5">
            <CurriculumList course={course} currentId={currentId} />
          </Plate>
        )}
      </section>
    </div>
  );
}
