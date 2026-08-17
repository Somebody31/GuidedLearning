// Build a short study list that fits inside a time budget.
// Order: due reviews first, then weak, then resume, then new lessons.

import type { Course, SessionPackItem } from "../types";

export function lessonPackCost(lesson: { estMinutes: number }): number {
  return lesson.estMinutes;
}

function sortShortestFirst<T extends { estMinutes: number }>(lessons: T[]): T[] {
  const copy = lessons.slice();
  copy.sort((a, b) => a.estMinutes - b.estMinutes);
  return copy;
}

export function buildSessionPack(
  course: Course,
  budgetMinutes: number,
): SessionPackItem[] {
  const lessons = Object.values(course.lessons);

  const due: SessionPackItem[] = [];
  const weak: SessionPackItem[] = [];
  const resume: SessionPackItem[] = [];
  const available: SessionPackItem[] = [];

  for (const lesson of sortShortestFirst(lessons)) {
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
  const now = Date.now();

  // A few passes so leftover minutes can pick up a smaller lesson.
  for (let pass = 0; pass < 3; pass++) {
    let added = false;
    for (const tier of tiers) {
      for (const item of tier) {
        if (packed.has(item.lessonId)) {
          continue;
        }
        const lesson = course.lessons[item.lessonId];
        if (!lesson) {
          continue;
        }
        if (lesson.status === "deferred" && lesson.deferredUntil) {
          if (new Date(lesson.deferredUntil).getTime() > now) {
            continue;
          }
        }

        const cost = lessonPackCost(lesson);
        // First item is always allowed, even if it is a bit over budget.
        if (used + cost > budgetMinutes && pack.length > 0) {
          continue;
        }

        pack.push(item);
        packed.add(item.lessonId);
        used += cost;
        added = true;
        if (used >= budgetMinutes) {
          return pack;
        }
      }
    }
    if (!added) {
      break;
    }
  }

  return pack;
}
