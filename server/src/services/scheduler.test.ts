import { describe, expect, test } from "bun:test";
import { applyQuizAttempt, scoreAnswers } from "./scheduler";
import type { Lesson } from "../types";

function baseLesson(over: Partial<Lesson> = {}): Lesson {
  return {
    id: "l1",
    unitId: "u1",
    title: "Test",
    estMinutes: 10,
    status: "available",
    mastery: 0.2,
    difficulty: 0,
    packPriority: 0,
    objectives: [],
    sections: [],
    citations: [],
    quiz: [],
    quizReady: true,
    contentVersion: 1,
    ...over,
  };
}

describe("applyQuizAttempt", () => {
  test("attempt 1 pass raises mastery", () => {
    const r = applyQuizAttempt({
      lesson: baseLesson(),
      score: 1,
      attemptIndex: 1,
    });
    expect(r.masteryAfter).toBeGreaterThan(r.masteryBefore);
    expect(r.masteryRaised).toBe(true);
    expect(["mastered", "due", "available"]).toContain(r.status);
  });

  test("attempt 2 does not raise mastery on pass", () => {
    const lesson = baseLesson({ mastery: 0.5, status: "weak" });
    const r = applyQuizAttempt({
      lesson,
      score: 1,
      attemptIndex: 2,
    });
    expect(r.masteryAfter).toBeLessThanOrEqual(0.5 + 0.001);
    expect(r.masteryRaised).toBe(false);
  });

  test("fail marks weak", () => {
    const r = applyQuizAttempt({
      lesson: baseLesson({ mastery: 0.4 }),
      score: 0.2,
      attemptIndex: 1,
    });
    expect(r.status).toBe("weak");
  });
});

describe("scoreAnswers", () => {
  test("computes fraction correct", () => {
    expect(
      scoreAnswers(
        [
          { id: "q1", correctOptionId: "b" },
          { id: "q2", correctOptionId: "a" },
        ],
        { q1: "b", q2: "c" },
      ),
    ).toBe(0.5);
  });
});
