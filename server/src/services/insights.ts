// Extra stats for the Insights page: mastery by unit, due count, etc.

import type { Course, EvalSample } from "../types";
import { buildSessionPack } from "./packer";

export function buildInsights(
  course: Course,
  evals: EvalSample[],
  budget = course.sessionDefaultMinutes,
) {
  const lessons = Object.values(course.lessons);
  const byUnit = [];

  for (const unit of course.units) {
    const unitLessons = [];
    for (const id of unit.lessonIds) {
      const lesson = course.lessons[id];
      if (lesson) {
        unitLessons.push(lesson);
      }
    }

    let masterySum = 0;
    let due = 0;
    let weak = 0;
    let mastered = 0;
    for (const lesson of unitLessons) {
      masterySum += lesson.mastery;
      if (lesson.status === "due") due += 1;
      if (lesson.status === "weak") weak += 1;
      if (lesson.status === "mastered") mastered += 1;
    }

    const avg = unitLessons.length === 0 ? 0 : masterySum / unitLessons.length;
    byUnit.push({
      unitId: unit.id,
      title: unit.title,
      lessonCount: unitLessons.length,
      masteryAvg: Math.round(avg * 1000) / 1000,
      due,
      weak,
      mastered,
    });
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  let dueNext7 = 0;
  let dueOrWeak = 0;
  let deferred = 0;
  for (const lesson of lessons) {
    if (lesson.status === "due" || lesson.status === "weak") {
      dueOrWeak += 1;
      dueNext7 += 1;
      continue;
    }
    if (lesson.status === "deferred") {
      deferred += 1;
    }
    if (lesson.nextReviewAt) {
      const t = new Date(lesson.nextReviewAt).getTime();
      if (t >= now && t <= now + weekMs) {
        dueNext7 += 1;
      }
    }
  }

  const pack = buildSessionPack(course, budget);
  const sampled = evals.slice(-20);
  const judged = sampled.filter((e) => e.faithful !== null);
  let faithfulRate: number | null = null;
  if (judged.length > 0) {
    let ok = 0;
    for (const e of judged) {
      if (e.faithful) ok += 1;
    }
    faithfulRate = ok / judged.length;
  }

  let evalNote = "No faithfulness samples yet — generated after lesson content exists.";
  if (faithfulRate !== null) {
    evalNote = "Offline lexical overlap proxy (not a live LLM judge).";
  }

  return {
    masteryByUnit: byUnit,
    schedule: {
      dueOrWeak,
      dueNext7Days: dueNext7,
      deferred,
      packPreview: pack,
    },
    eval: {
      sampleCount: sampled.length,
      faithfulRate,
      note: evalNote,
      recent: sampled.slice(-5),
    },
  };
}
