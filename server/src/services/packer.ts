import type { Course, SessionPackItem } from "../types";

/** Lesson study time only — quiz assumed inside estMinutes for packing density. */
export function lessonPackCost(lesson: { estMinutes: number }): number {
  return lesson.estMinutes;
}

/**
 * Priority: due → weak → resume → new.
 * Multi-pass fill; first item may exceed budget so packs are never empty when work exists.
 * Port of web/src/lib/mock-data.ts buildSessionPack.
 */
export function buildSessionPack(
  course: Course,
  budgetMinutes: number,
): SessionPackItem[] {
  const lessons = Object.values(course.lessons);
  const due = lessons.filter((l) => l.status === "due");
  const weak = lessons.filter((l) => l.status === "weak");
  const resume = lessons.filter((l) => l.status === "in_progress");
  const available = lessons.filter((l) => l.status === "available");

  const tiers: SessionPackItem[][] = [
    due
      .slice()
      .sort((a, b) => a.estMinutes - b.estMinutes)
      .map((l) => ({ lessonId: l.id, kind: "review" as const })),
    weak
      .slice()
      .sort((a, b) => a.estMinutes - b.estMinutes)
      .map((l) => ({ lessonId: l.id, kind: "weak" as const })),
    resume
      .slice()
      .sort((a, b) => a.estMinutes - b.estMinutes)
      .map((l) => ({ lessonId: l.id, kind: "resume" as const })),
    available
      .slice()
      .sort((a, b) => a.estMinutes - b.estMinutes)
      .map((l) => ({ lessonId: l.id, kind: "new" as const })),
  ];

  const pack: SessionPackItem[] = [];
  let used = 0;
  const packed = new Set<string>();
  const now = Date.now();

  for (let pass = 0; pass < 3; pass++) {
    let added = false;
    for (const tier of tiers) {
      for (const item of tier) {
        if (packed.has(item.lessonId)) continue;
        const lesson = course.lessons[item.lessonId];
        if (!lesson) continue;
        if (lesson.status === "deferred") {
          if (
            lesson.deferredUntil &&
            new Date(lesson.deferredUntil).getTime() > now
          ) {
            continue;
          }
        }
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
