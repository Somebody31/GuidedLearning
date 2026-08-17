// Linear path of units and lessons, in authored order.

import Link from "next/link";
import { StateBadge } from "@/components/ui/state-badge";
import type { Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CurriculumList({
  course,
  currentId,
}: {
  course: Course;
  currentId?: string | null;
}) {
  return (
    <div className="space-y-7">
      {course.units.map((unit) => {
        const lessons = unit.lessonIds
          .map((id) => course.lessons[id])
          .filter(Boolean) as Lesson[];
        return (
          <section key={unit.id}>
            <h3 className="mb-2 text-[13px] font-medium text-[var(--text-tertiary)]">
              {unit.title}
              <span className="ml-2 font-normal tabular text-[var(--text-disabled)]">
                {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
              </span>
            </h3>
            <ul className="space-y-1.5">
              {lessons.map((lesson) => {
                const locked = lesson.status === "locked";
                const current = currentId === lesson.id;
                const row = (
                  <div
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
                      current
                        ? "bg-[var(--accent-muted)]"
                        : "hover:bg-[var(--surface-2)]",
                      locked && "opacity-70",
                    )}
                  >
                    <span
                      className="h-6 w-1 shrink-0 rounded-full"
                      style={{
                        background: current
                          ? "var(--accent)"
                          : "transparent",
                      }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">
                        {lesson.title}
                      </p>
                      <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                        {lesson.estMinutes} min
                      </p>
                    </div>
                    <StateBadge status={lesson.status} />
                  </div>
                );

                if (locked) {
                  return <li key={lesson.id}>{row}</li>;
                }

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/app/courses/${course.id}/lessons/${lesson.id}`}
                    >
                      {row}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
