"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { getCourse } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

export default function QuizPage() {
  const params = useParams();
  const courseId = String(params.id);
  const lessonId = String(params.lessonId);
  const course = getCourse(courseId);
  const lesson = course?.lessons[lessonId];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [done, setDone] = useState(false);

  const questions = lesson?.quiz ?? [];
  const q = questions[index];
  const masteryBefore = lesson?.mastery ?? 0;

  const masteryAfter = useMemo(() => {
    if (!done || questions.length === 0) return masteryBefore;
    const score = correctCount / questions.length;
    if (attempt > 1) return masteryBefore;
    return Math.min(1, masteryBefore * 0.4 + score * 0.6 + 0.1);
  }, [done, correctCount, questions.length, masteryBefore, attempt]);

  const quizReady = Boolean(lesson?.quizReady && questions.length > 0);

  useEffect(() => {
    if (done || !quizReady) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (!selected || !q) return;
      e.preventDefault();
      if (!revealed) {
        setRevealed(true);
        if (selected === q.correctOptionId) setCorrectCount((c) => c + 1);
        return;
      }
      if (index + 1 >= questions.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
        setRevealed(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, quizReady, selected, revealed, index, q, questions.length]);

  if (!course || !lesson) {
    return (
      <div className="p-8 text-[var(--text-secondary)]">Lesson missing.</div>
    );
  }

  if (!quizReady) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-[20px] font-semibold">Quiz not ready</h1>
        <p className="text-[14px] text-[var(--text-secondary)]">
          We couldn&apos;t generate this quiz yet. Retry later or return to the
          lesson.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Link
            href={`/app/courses/${courseId}/lessons/${lessonId}`}
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--accent)] px-4 text-[14px] font-medium text-[var(--text-invert)]"
          >
            Back to lesson
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16">
        <p className="text-[12px] font-medium text-[var(--accent)]">
          What changed
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          Quiz complete
        </h1>
        <p className="mt-2 tabular text-[15px] text-[var(--text-secondary)]">
          Score {score}% · attempt {attempt}/3
        </p>
        <div className="mt-8 space-y-4 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[var(--text-secondary)]">Mastery</span>
            <div className="flex items-center gap-3">
              <MasteryRing value={masteryBefore} />
              <span className="text-[var(--text-tertiary)]">→</span>
              <MasteryRing value={masteryAfter} />
            </div>
          </div>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Next review scheduled for{" "}
            <span className="text-[var(--text-primary)]">
              {attempt === 1 && score >= 70 ? "in 3 days" : "tomorrow"}
            </span>
          </p>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Difficulty:{" "}
            <span className="text-[var(--text-primary)]">
              {score >= 80 ? "Harder items next time" : score < 50 ? "Easier items next time" : "Same"}
            </span>
          </p>
          {attempt > 1 && (
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Retries update difficulty and queue — not upward mastery.
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/app/courses/${courseId}`}
            className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)]"
          >
            Back to path
          </Link>
          {attempt < 3 && score < 100 && (
            <Button
              variant="secondary"
              onClick={() => {
                setAttempt((a) => a + 1);
                setIndex(0);
                setSelected(null);
                setRevealed(false);
                setCorrectCount(0);
                setDone(false);
              }}
            >
              Retry (attempt {attempt + 1}/3)
            </Button>
          )}
          <Link
            href={`/app/courses/${courseId}/session`}
            className="inline-flex h-10 items-center rounded-full border border-[var(--hairline)] px-5 text-[14px] text-[var(--text-secondary)]"
          >
            Next in session
          </Link>
        </div>
      </div>
    );
  }

  function submit() {
    if (!q || !selected) return;
    if (!revealed) {
      setRevealed(true);
      if (selected === q.correctOptionId) setCorrectCount((c) => c + 1);
      return;
    }
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-lg px-4 py-10">
      <div className="flex items-center justify-between text-[13px] text-[var(--text-tertiary)]">
        <span>
          {lesson.title}
        </span>
        <span className="tabular">
          Q {index + 1} of {questions.length}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-[var(--duration-med)]"
          style={{ width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <h1 className="mt-8 text-[20px] font-semibold leading-snug">{q.stem}</h1>

      <ul className="mt-6 space-y-2" role="listbox" aria-label="Answers">
        {q.options.map((opt) => {
          const isSel = selected === opt.id;
          const isCorrect = opt.id === q.correctOptionId;
          return (
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSel}
                disabled={revealed}
                onClick={() => setSelected(opt.id)}
                className={cn(
                  "w-full rounded-[var(--radius-lg)] border px-4 py-3 text-left text-[14px] transition-colors",
                  !revealed && isSel && "border-[var(--accent)] bg-[var(--accent-muted)]",
                  !revealed && !isSel && "border-[var(--hairline)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
                  revealed && isCorrect && "border-[var(--success)] bg-[rgba(52,211,153,0.12)]",
                  revealed && isSel && !isCorrect && "border-[var(--danger)] bg-[rgba(248,113,113,0.1)]",
                  revealed && !isSel && !isCorrect && "border-[var(--hairline)] opacity-60",
                )}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <p
          className="mt-4 text-[14px] text-[var(--text-secondary)]"
          aria-live="polite"
        >
          {q.explanation}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-3">
        <Link
          href={`/app/courses/${courseId}/lessons/${lessonId}`}
          className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Back to lesson
        </Link>
        <div className="flex items-center gap-2">
          {selected && (
            <span className="hidden text-[12px] text-[var(--text-tertiary)] sm:inline">
              <kbd className="rounded border border-[var(--hairline)] px-1">
                Enter
              </kbd>
            </span>
          )}
          <Button onClick={submit} disabled={!selected}>
            {!revealed
              ? "Check"
              : index + 1 >= questions.length
                ? "Finish"
                : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
