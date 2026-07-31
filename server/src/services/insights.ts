import type { Course, EvalSample } from "../types";
import { buildSessionPack } from "./packer";

export function buildInsights(
  course: Course,
  evals: EvalSample[],
  budget = course.sessionDefaultMinutes,
) {
  const lessons = Object.values(course.lessons);
  const byUnit = course.units.map((u) => {
    const ls = u.lessonIds
      .map((id) => course.lessons[id])
      .filter(Boolean) as Course["lessons"][string][];
    const avg =
      ls.length === 0
        ? 0
        : ls.reduce((s, l) => s + l.mastery, 0) / ls.length;
    return {
      unitId: u.id,
      title: u.title,
      lessonCount: ls.length,
      masteryAvg: Math.round(avg * 1000) / 1000,
      due: ls.filter((l) => l.status === "due").length,
      weak: ls.filter((l) => l.status === "weak").length,
      mastered: ls.filter((l) => l.status === "mastered").length,
    };
  });

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const dueNext7 = lessons.filter((l) => {
    if (l.status === "due" || l.status === "weak") return true;
    if (!l.nextReviewAt) return false;
    const t = new Date(l.nextReviewAt).getTime();
    return t >= now && t <= now + weekMs;
  }).length;

  const pack = buildSessionPack(course, budget);
  const sampled = evals.slice(-20);
  const judged = sampled.filter((e) => e.faithful !== null);
  const faithfulRate =
    judged.length === 0
      ? null
      : judged.filter((e) => e.faithful).length / judged.length;

  return {
    masteryByUnit: byUnit,
    schedule: {
      dueOrWeak: lessons.filter(
        (l) => l.status === "due" || l.status === "weak",
      ).length,
      dueNext7Days: dueNext7,
      deferred: lessons.filter((l) => l.status === "deferred").length,
      packPreview: pack,
    },
    eval: {
      sampleCount: sampled.length,
      faithfulRate,
      note:
        faithfulRate === null
          ? "No faithfulness samples yet — generated after lesson content exists."
          : "Offline lexical overlap proxy (not a live LLM judge).",
      recent: sampled.slice(-5),
    },
  };
}
