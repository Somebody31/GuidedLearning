// Update lesson status after a quiz or a diagnostic.
// Passing the first attempt can raise mastery. Later retries do not.

import type { Lesson, LessonStatus } from "../types";

const PASS = 0.7;

export type QuizApplyResult = {
  masteryBefore: number;
  masteryAfter: number;
  status: LessonStatus;
  nextReviewAt?: string;
  difficulty: number;
  masteryRaised: boolean;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function applyQuizAttempt(opts: {
  lesson: Lesson;
  score: number;
  attemptIndex: number;
  now?: Date;
}): QuizApplyResult {
  const now = opts.now ?? new Date();
  const masteryBefore = opts.lesson.mastery;
  let masteryAfter = masteryBefore;
  let difficulty = opts.lesson.difficulty;
  let status: LessonStatus = opts.lesson.status;
  let nextReviewAt = opts.lesson.nextReviewAt;
  let masteryRaised = false;
  const pass = opts.score >= PASS;

  if (pass) {
    difficulty = Math.max(-2, difficulty - 0.15);
  } else {
    difficulty = Math.min(2, difficulty + 0.25);
  }

  if (opts.attemptIndex === 1) {
    if (pass) {
      const gain = 0.25 + opts.score * 0.35;
      masteryAfter = Math.min(1, Math.max(masteryBefore, masteryBefore * 0.4 + gain));
      if (masteryAfter > masteryBefore + 0.001) {
        masteryRaised = true;
      }
      if (masteryAfter >= 0.85) {
        status = "mastered";
        nextReviewAt = addDays(now, 7).toISOString();
      } else if (masteryAfter >= 0.55) {
        status = "due";
        nextReviewAt = addDays(now, 3).toISOString();
      } else {
        status = "available";
        nextReviewAt = addDays(now, 1).toISOString();
      }
    } else {
      masteryAfter = Math.max(0, masteryBefore * 0.85);
      status = "weak";
      nextReviewAt = addDays(now, 1).toISOString();
    }
  } else {
    // Retries: do not raise mastery.
    if (!pass) {
      status = "weak";
      nextReviewAt = addDays(now, 1).toISOString();
      masteryAfter = Math.min(masteryBefore, Math.max(0, masteryBefore - 0.05));
    } else if (status === "weak" || status === "due") {
      if (masteryBefore >= 0.85) {
        status = "mastered";
        nextReviewAt = addDays(now, 5).toISOString();
      } else {
        status = "due";
        nextReviewAt = addDays(now, 2).toISOString();
      }
    }
  }

  return {
    masteryBefore,
    masteryAfter,
    status,
    nextReviewAt,
    difficulty,
    masteryRaised,
  };
}

// First unit starts unlocked. Later units stay locked until you progress.
export function initLessonStatesOnActivate(
  lessons: Record<string, Lesson>,
  units: { order: number; lessonIds: string[] }[],
) {
  const orderedUnits = units.slice().sort((a, b) => a.order - b.order);
  for (let ui = 0; ui < orderedUnits.length; ui++) {
    const unit = orderedUnits[ui];
    if (!unit) continue;
    for (const lid of unit.lessonIds) {
      const lesson = lessons[lid];
      if (!lesson) continue;
      lesson.status = ui === 0 ? "available" : "locked";
      lesson.mastery = 0;
      lesson.difficulty = 0;
      lesson.packPriority = 0;
      lesson.deferredUntil = undefined;
      lesson.nextReviewAt = undefined;
    }
  }
}

// Unlock the next lesson in the course after a good first quiz.
export function unlockNextLessons(
  lessons: Record<string, Lesson>,
  units: { order: number; lessonIds: string[] }[],
  completedId: string,
) {
  const ordered: string[] = [];
  const sorted = units.slice().sort((a, b) => a.order - b.order);
  for (const unit of sorted) {
    for (const id of unit.lessonIds) {
      ordered.push(id);
    }
  }

  const idx = ordered.indexOf(completedId);
  if (idx < 0) return;
  const nextId = ordered[idx + 1];
  if (!nextId) return;
  const next = lessons[nextId];
  if (next && next.status === "locked") {
    next.status = "available";
  }
}

export function applyDiagnosticPlacement(
  lesson: Lesson,
  choice: "strong" | "ok" | "weak" | "skip",
) {
  if (choice === "strong") {
    lesson.status = "available";
    lesson.packPriority = 20;
    lesson.mastery = 0;
  } else if (choice === "ok") {
    lesson.status = "available";
    lesson.packPriority = 5;
  } else if (choice === "weak") {
    lesson.status = "weak";
    lesson.packPriority = 0;
  } else {
    lesson.status = "available";
    lesson.packPriority = 0;
  }
}

export function scoreAnswers(
  questions: { id: string; correctOptionId: string }[],
  answers: Record<string, string>,
): number {
  if (questions.length === 0) return 0;
  let right = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctOptionId) {
      right += 1;
    }
  }
  return right / questions.length;
}
