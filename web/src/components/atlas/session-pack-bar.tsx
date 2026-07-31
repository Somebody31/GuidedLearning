"use client";

import Link from "next/link";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Course, SessionPackItem } from "@/lib/types";

export function SessionPackBar({
  course,
  pack,
  budget,
  onBudgetChange,
}: {
  course: Course;
  pack: SessionPackItem[];
  budget: number;
  onBudgetChange: (n: number) => void;
}) {
  const counts = {
    review: pack.filter((p) => p.kind === "review").length,
    weak: pack.filter((p) => p.kind === "weak").length,
    new: pack.filter((p) => p.kind === "new" || p.kind === "resume").length,
  };
  const minutes = pack.reduce(
    (sum, p) => sum + (course.lessons[p.lessonId]?.estMinutes ?? 0) + 4,
    0,
  );

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)]/90 p-3 md:flex-row md:items-center md:justify-between md:p-4">
      <div className="min-w-0">
        <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Today&apos;s pack
        </p>
        <p className="mt-0.5 text-[15px] text-[var(--text-primary)]">
          <span className="tabular">~{minutes} min</span>
          <span className="text-[var(--text-tertiary)]"> · </span>
          {counts.review > 0 && (
            <span className="text-[var(--state-due)]">{counts.review} due</span>
          )}
          {counts.review > 0 && (counts.weak > 0 || counts.new > 0) && (
            <span className="text-[var(--text-tertiary)]"> · </span>
          )}
          {counts.weak > 0 && (
            <span className="text-[var(--state-weak)]">{counts.weak} weak</span>
          )}
          {counts.weak > 0 && counts.new > 0 && (
            <span className="text-[var(--text-tertiary)]"> · </span>
          )}
          {counts.new > 0 && (
            <span className="text-[var(--accent)]">{counts.new} new/resume</span>
          )}
          {pack.length === 0 && (
            <span className="text-[var(--text-secondary)]">
              Nothing due · you&apos;re clear for today
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel="Session duration"
          value={String(budget)}
          onChange={(v) => onBudgetChange(Number(v))}
          options={[
            { value: "15", label: "15" },
            { value: "25", label: "25" },
            { value: "45", label: "45" },
            { value: "60", label: "60" },
          ]}
        />
        {pack.length === 0 ? (
          <span className="inline-flex h-10 cursor-not-allowed items-center rounded-full bg-[var(--surface-3)] px-5 text-[15px] font-medium text-[var(--text-disabled)]">
            Start session
          </span>
        ) : (
          <Link
            href={`/app/courses/${course.id}/session`}
            className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[15px] font-medium text-[var(--text-invert)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            Start session
          </Link>
        )}
      </div>
    </div>
  );
}
