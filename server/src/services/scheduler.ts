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

/**
 * Quiz is the only completion gate. Attempt 1 may raise mastery;
 * retries 2–3 adjust difficulty / weak queue only.
 */
export function applyQuizAttempt(opts: {
  lesson: Lesson;
  score: number; // 0–1
  attemptIndex: number; // 1-based
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

  // Difficulty: always nudge
  if (pass) difficulty = Math.max(-2, difficulty - 0.15);
  else difficulty = Math.min(2, difficulty + 0.25);

  if (opts.attemptIndex === 1) {
    if (pass) {
      const gain = 0.25 + opts.score * 0.35;
      masteryAfter = Math.min(1, Math.max(masteryBefore, masteryBefore * 0.4 + gain));
      masteryRaised = masteryAfter > masteryBefore + 0.001;
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
    // retries: no upward mastery
    if (!pass) {
      status = "weak";
      nextReviewAt = addDays(now, 1).toISOString();
      masteryAfter = Math.min(masteryBefore, Math.max(0, masteryBefore - 0.05));
    } else if (status === "weak" || status === "due") {
      // stabilize without inflating
      status = masteryBefore >= 0.85 ? "mastered" : "due";
      nextReviewAt = addDays(now, masteryBefore >= 0.85 ? 5 : 2).toISOString();
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

export function initLessonStatesOnActivate(lessons: Record<string, Lesson>, units: { order: number; lessonIds: string[] }[]) {
  const orderedUnits = [...units].sort((a, b) => a.order - b.order);
  orderedUnits.forEach((unit, ui) => {
    unit.lessonIds.forEach((lid, li) => {
      const lesson = lessons[lid];
      if (!lesson) return;
      if (ui === 0 && li === 0) {
        lesson.status = "available";
      } else if (ui === 0) {
        lesson.status = "available";
      } else {
        lesson.status = "locked";
      }
      lesson.mastery = 0;
      lesson.difficulty = 0;
      lesson.packPriority = 0;
      lesson.deferredUntil = undefined;
      lesson.nextReviewAt = undefined;
    });
  });
}

/** Unlock next lesson in sequence when current is completed (quiz). */
export function unlockNextLessons(
  lessons: Record<string, Lesson>,
  units: { order: number; lessonIds: string[] }[],
  completedId: string,
) {
  const ordered = [...units]
    .sort((a, b) => a.order - b.order)
    .flatMap((u) => u.lessonIds);
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
  // Never auto-master
  if (choice === "strong") {
    lesson.status = "available";
    lesson.packPriority = 20; // low pack priority
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

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function scoreAnswers(
  questions: { id: string; correctOptionId: string }[],
  answers: Record<string, string>,
): number {
  if (questions.length === 0) return 0;
  let right = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctOptionId) right++;
  }
  return right / questions.length;
}
