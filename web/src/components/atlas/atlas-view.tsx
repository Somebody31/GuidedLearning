"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourseAtlas } from "./course-atlas";
import { CurriculumList } from "./curriculum-list";
import { SessionPackBar } from "./session-pack-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StateBadge } from "@/components/ui/state-badge";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { buildSessionPack, unitForLesson } from "@/lib/mock-data";
import type { Course } from "@/lib/types";

export function AtlasView({ course }: { course: Course }) {
  const router = useRouter();
  const [view, setView] = useState<"map" | "list">("map");
  const [budget, setBudget] = useState(course.sessionDefaultMinutes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pack = useMemo(
    () => buildSessionPack(course, budget),
    [course, budget],
  );

  const selected = selectedId ? course.lessons[selectedId] : null;
  const unit = selected ? unitForLesson(course, selected.id) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
        setView((v) => (v === "map" ? "list" : "map"));
      }
      if (e.key === "Escape") setSelectedId(null);
      if ((e.key === "s" || e.key === "S") && pack.length > 0) {
        e.preventDefault();
        router.push(`/app/courses/${course.id}/session`);
      }
      if (e.key === "Enter" && selectedId) {
        const lesson = course.lessons[selectedId];
        if (lesson && lesson.status !== "locked") {
          e.preventDefault();
          router.push(`/app/courses/${course.id}/lessons/${selectedId}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pack.length, course.id, course.lessons, router, selectedId]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem-3.5rem)] max-w-[1440px] flex-col gap-4 p-4 sm:h-[calc(100dvh-3.5rem)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-[28px]">
            {course.title}
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Course atlas · quiz completes lessons · spaced reviews on due nodes
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Atlas view"
          value={view}
          onChange={setView}
          options={[
            { value: "map", label: "Map" },
            { value: "list", label: "List" },
          ]}
        />
      </div>

      <SessionPackBar
        course={course}
        pack={pack}
        budget={budget}
        onBudgetChange={setBudget}
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-h-0 min-w-0">
          {view === "map" ? (
            <CourseAtlas
              course={course}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="h-full max-h-[min(70dvh,720px)] overflow-auto rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-0)] p-4 lg:max-h-none">
              <CurriculumList
                course={course}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          )}
        </div>

        {/* Empty inspector is desktop-only; mobile shows panel only when a lesson is selected */}
        <aside
          className={`surface-card flex min-h-[160px] flex-col p-4 lg:min-h-0 ${
            selected ? "flex" : "hidden lg:flex"
          }`}
        >
          {selected && unit ? (
            <>
              <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
                {unit.title}
              </p>
              <h2 className="mt-1 text-[18px] font-semibold leading-snug">
                {selected.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StateBadge status={selected.status} />
                <MasteryRing value={selected.mastery} />
                <span className="tabular text-[12px] text-[var(--text-tertiary)]">
                  {selected.estMinutes} min
                </span>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-4 text-[13px] text-[var(--text-secondary)]">
                {selected.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-[var(--text-tertiary)]">
                {selected.citations.length} citation
                {selected.citations.length === 1 ? "" : "s"}
              </p>
              <div className="mt-auto flex gap-2 pt-6">
                <button
                  type="button"
                  className="inline-flex h-10 shrink-0 items-center rounded-full border border-[var(--hairline)] px-3 text-[13px] text-[var(--text-tertiary)] lg:hidden"
                  onClick={() => setSelectedId(null)}
                >
                  Close
                </button>
                {selected.status === "locked" ? (
                  <p className="text-[13px] text-[var(--text-tertiary)]">
                    Locked · complete prerequisites first
                  </p>
                ) : (
                  <div className="flex w-full flex-col gap-2">
                    <Link
                      href={`/app/courses/${course.id}/lessons/${selected.id}`}
                      className="cta-primary w-full"
                    >
                      {selected.status === "in_progress"
                        ? "Resume lesson"
                        : selected.status === "due"
                          ? "Start review"
                          : "Start lesson"}
                    </Link>
                    <p className="hidden text-center text-[11px] text-[var(--text-tertiary)] lg:block">
                      <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                        Enter
                      </kbd>{" "}
                      opens ·{" "}
                      <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                        Esc
                      </kbd>{" "}
                      clears
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col">
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                Select a lesson on the path
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                <kbd className="rounded border border-[var(--hairline)] px-1 text-[var(--text-secondary)]">
                  M
                </kbd>{" "}
                map/list ·{" "}
                <kbd className="rounded border border-[var(--hairline)] px-1 text-[var(--text-secondary)]">
                  S
                </kbd>{" "}
                start session
              </p>
              {pack.length > 0 && (
                <div className="mt-6 border-t border-[var(--hairline)] pt-4">
                  <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
                    In today&apos;s pack
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {pack.slice(0, 4).map((item) => {
                      const l = course.lessons[item.lessonId];
                      const kindColor =
                        item.kind === "review"
                          ? "text-[var(--state-due)]"
                          : item.kind === "weak"
                            ? "text-[var(--state-weak)]"
                            : "text-[var(--accent)]";
                      return (
                        <li key={item.lessonId}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.lessonId)}
                            className="w-full truncate rounded-[var(--radius-md)] px-2 py-1.5 text-left text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                          >
                            <span className={`capitalize ${kindColor}`}>
                              {item.kind}
                            </span>
                            {" · "}
                            {l?.title ?? item.lessonId}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
