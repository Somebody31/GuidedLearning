import Link from "next/link";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { StateBadge } from "@/components/ui/state-badge";
import type { Course, Lesson, LessonStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS_ORDER: LessonStatus[] = [
  "due",
  "weak",
  "deferred",
  "in_progress",
  "available",
  "remediation",
  "mastered",
  "locked",
];

function sortLessons(lessons: Lesson[]) {
  return [...lessons].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
}

export function CurriculumList({
  course,
  selectedId,
  onSelect,
}: {
  course: Course;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6 overflow-y-auto p-1">
      {course.units.map((unit) => {
        const lessons = sortLessons(
          unit.lessonIds
            .map((id) => course.lessons[id])
            .filter(Boolean) as Lesson[],
        );
        return (
          <section key={unit.id}>
            <h3 className="mb-2 text-[12px] font-medium text-[var(--text-tertiary)]">
              {unit.title}
            </h3>
            <ul className="space-y-2">
              {lessons.map((lesson) => {
                const locked = lesson.status === "locked";
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(lesson.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border px-3 py-2.5 text-left transition-colors",
                        selectedId === lesson.id
                          ? "border-[var(--accent)] bg-[var(--surface-2)]"
                          : "border-[var(--hairline)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
                        locked && "opacity-75",
                      )}
                    >
                      <MasteryRing value={lesson.mastery} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium">
                          {lesson.title}
                        </p>
                        <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                          {lesson.estMinutes} min
                        </p>
                      </div>
                      <StateBadge status={lesson.status} />
                      {!locked && (
                        <Link
                          href={`/app/courses/${course.id}/lessons/${lesson.id}`}
                          className="shrink-0 text-[12px] text-[var(--accent)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      )}
                    </button>
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
