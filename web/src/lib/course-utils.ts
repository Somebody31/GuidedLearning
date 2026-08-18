// Helpers used by Today and sitting pages. Subject-agnostic.

import type { Citation, Course, CourseKind, SessionPackItem } from "./types";

export function courseKindOf(
  course: { kind?: CourseKind } | null | undefined,
): CourseKind {
  return course?.kind === "code" ? "code" : "document";
}

export function citationWhere(c: Pick<Citation, "locator" | "page">): string {
  return c.locator?.trim() || `p.${c.page}`;
}

export function unitForLesson(course: Course, lessonId: string) {
  const lesson = course.lessons[lessonId];
  if (!lesson) return undefined;
  return course.units.find((u) => u.id === lesson.unitId);
}

export function lessonPackCost(lesson: { estMinutes: number }): number {
  return lesson.estMinutes;
}

export function buildSessionPack(
  course: Course,
  budgetMinutes: number,
): SessionPackItem[] {
  const lessons = Object.values(course.lessons).slice();
  lessons.sort((a, b) => a.estMinutes - b.estMinutes);

  const due: SessionPackItem[] = [];
  const weak: SessionPackItem[] = [];
  const resume: SessionPackItem[] = [];
  const available: SessionPackItem[] = [];

  for (const lesson of lessons) {
    if (lesson.status === "due") {
      due.push({ lessonId: lesson.id, kind: "review" });
    } else if (lesson.status === "weak") {
      weak.push({ lessonId: lesson.id, kind: "weak" });
    } else if (lesson.status === "in_progress") {
      resume.push({ lessonId: lesson.id, kind: "resume" });
    } else if (lesson.status === "available") {
      available.push({ lessonId: lesson.id, kind: "new" });
    }
  }

  const tiers = [due, weak, resume, available];
  const pack: SessionPackItem[] = [];
  const packed = new Set<string>();
  let used = 0;

  for (let pass = 0; pass < 3; pass++) {
    let added = false;
    for (const tier of tiers) {
      for (const item of tier) {
        if (packed.has(item.lessonId)) continue;
        const lesson = course.lessons[item.lessonId];
        if (!lesson || lesson.status === "deferred") continue;
        const cost = lessonPackCost(lesson);
        if (used + cost > budgetMinutes && pack.length > 0) continue;
        pack.push(item);
        packed.add(item.lessonId);
        used += cost;
        added = true;
        if (used >= budgetMinutes) return pack;
      }
    }
    if (!added) break;
  }
  return pack;
}