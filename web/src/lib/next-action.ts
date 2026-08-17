// Decide the single next move for a course. Subject-agnostic.

import { buildSessionPack, unitForLesson } from "./course-utils";
import type { Course, CourseSummary, Lesson, SessionPackItem } from "./types";

export const PACK_KIND_LABEL: Record<SessionPackItem["kind"], string> = {
  review: "Due today",
  weak: "Needs practice",
  resume: "In progress",
  new: "Next on the path",
};

export const PACK_KIND_ACTION: Record<SessionPackItem["kind"], string> = {
  review: "Start review",
  weak: "Practice this",
  resume: "Resume lesson",
  new: "Start lesson",
};

export function courseHomeHref(course: Pick<CourseSummary, "id" | "lifecycle">) {
  if (course.lifecycle === "activated") return `/app/courses/${course.id}`;
  return `/app/courses/${course.id}/confirm`;
}

export function firstUnlockedLesson(course: Course): Lesson | undefined {
  for (const unit of course.units) {
    for (const id of unit.lessonIds) {
      const lesson = course.lessons[id];
      if (lesson && lesson.status !== "locked") return lesson;
    }
  }
  return undefined;
}

export type NextMove = {
  href: string;
  label: string;
  hint: string;
  kind: "confirm" | SessionPackItem["kind"] | "clear";
  lesson?: Lesson;
  unitTitle?: string;
  pack: SessionPackItem[];
};

export function nextMove(
  course: Course,
  budgetMinutes = course.sessionDefaultMinutes,
): NextMove {
  if (course.lifecycle !== "activated") {
    return {
      href: `/app/courses/${course.id}/confirm`,
      label: "Review the path",
      hint: "Edit titles until this matches how you want to study. Tracking starts after you confirm.",
      kind: "confirm",
      pack: [],
    };
  }

  const pack = buildSessionPack(course, budgetMinutes);
  const first = pack[0];
  const lesson = first ? course.lessons[first.lessonId] : undefined;

  if (first && lesson) {
    const unit = unitForLesson(course, lesson.id);
    return {
      href: `/app/courses/${course.id}/lessons/${lesson.id}`,
      label: PACK_KIND_ACTION[first.kind],
      hint: PACK_KIND_LABEL[first.kind],
      kind: first.kind,
      lesson,
      unitTitle: unit?.title,
      pack,
    };
  }

  const unlocked = firstUnlockedLesson(course);
  if (unlocked && unlocked.status !== "mastered") {
    const unit = unitForLesson(course, unlocked.id);
    return {
      href: `/app/courses/${course.id}/lessons/${unlocked.id}`,
      label: "Open lesson",
      hint: "Nothing is due. Continue the path.",
      kind: "new",
      lesson: unlocked,
      unitTitle: unit?.title,
      pack: [],
    };
  }

  return {
    href: `/app/courses/${course.id}`,
    label: "You're clear today",
    hint: "Nothing is waiting. Browse the path or come back when reviews land.",
    kind: "clear",
    pack: [],
  };
}
