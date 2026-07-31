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
    if (done && lesson) {
      document.title = `Quiz complete · ${lesson.title} · GuidedLearning`;
    } else if (lesson) {
      document.title = `Quiz · ${lesson.title} · GuidedLearning`;
    }
  }, [done, lesson]);

  useEffect(() => {
    if (done || !quizReady) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;

      if (!revealed && q) {
        const digit = Number(e.key);
        const letterIdx = "1234abcd".indexOf(e.key.toLowerCase());
        let pick = -1;
        if (digit >= 1 && digit <= q.options.length) pick = digit - 1;
        else if (letterIdx >= 0) {
          const mapped = letterIdx < 4 ? letterIdx : letterIdx - 4;
          if (mapped < q.options.length) pick = mapped;
        }
        if (pick >= 0) {
          e.preventDefault();
          setSelected(q.options[pick].id);
          return;
        }
      }

      if (e.key !== "Enter") return;
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
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          404
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Lesson missing
        </h1>
        <p className="max-w-sm text-[14px] text-[var(--text-secondary)]">
          This quiz has no matching lesson in the course map.
        </p>
        <Link href={`/app/courses/${courseId}`} className="cta-primary mt-2">
          Back to atlas
        </Link>
      </div>
    );
  }

  if (!quizReady) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          Not ready
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Quiz not ready
        </h1>
        <p className="max-w-sm text-[14px] text-[var(--text-secondary)]">
          We couldn&apos;t generate this quiz yet. Retry later or return to the
          lesson.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Link
            href={`/app/courses/${courseId}/lessons/${lessonId}`}
            className="cta-primary"
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
      <div className="animate-fade-up mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          What changed
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          Quiz complete
        </h1>
        <p className="mt-2 tabular text-[15px] text-[var(--text-secondary)]">
          Score {score}% · attempt {attempt}/3
        </p>
        <div className="mt-8 space-y-4 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] text-[var(--text-secondary)]">
              Mastery
            </span>
            <div className="flex items-center gap-3">
              <MasteryRing value={masteryBefore} />
              <span className="text-[var(--text-tertiary)]" aria-hidden>
                →
              </span>
              <MasteryRing value={masteryAfter} />
            </div>
          </div>
          <div className="border-t border-[var(--hairline)] pt-4">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Next review{" "}
              <span className="text-[var(--text-primary)]">
                {attempt === 1 && score >= 70 ? "in 3 days" : "tomorrow"}
              </span>
            </p>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Difficulty:{" "}
              <span className="text-[var(--text-primary)]">
                {score >= 80
                  ? "Harder items next time"
                  : score < 50
                    ? "Easier items next time"
                    : "Same"}
              </span>
            </p>
            {attempt > 1 && (
              <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
                Retries update difficulty and queue — not upward mastery.
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/app/courses/${courseId}`} className="cta-primary">
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
            className="cta-secondary"
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
      <div className="sticky top-0 z-[var(--z-raised)] -mx-4 mb-6 border-b border-[var(--hairline)] bg-[var(--canvas)]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between text-[13px] text-[var(--text-tertiary)]">
          <span className="min-w-0 truncate">{lesson.title}</span>
          <span className="tabular shrink-0">
            Q {index + 1} of {questions.length}
          </span>
        </div>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={index + (revealed ? 1 : 0)}
          aria-label="Quiz progress"
        >
          <div
            className="h-full bg-[var(--accent)] transition-all duration-[var(--duration-med)] ease-[var(--ease-out-soft)]"
            style={{
              width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <h1
        key={q.id}
        className="animate-fade-up text-[20px] font-semibold leading-snug"
      >
        {q.stem}
      </h1>

      <ul className="mt-6 space-y-2" role="listbox" aria-label="Answers">
        {q.options.map((opt, idx) => {
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
                  "flex w-full items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-left text-[14px] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
                  !revealed && isSel && "border-[var(--accent)] bg-[var(--accent-muted)] shadow-[0_0_0_1px_var(--accent-ring)]",
                  !revealed && !isSel && "border-[var(--hairline)] bg-[var(--surface-1)] hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)]",
                  revealed && isCorrect && "border-[var(--success)] bg-[rgba(52,211,153,0.12)]",
                  revealed && isSel && !isCorrect && "border-[var(--danger)] bg-[rgba(248,113,113,0.1)]",
                  revealed && !isSel && !isCorrect && "border-[var(--hairline)] opacity-60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                    !revealed && isSel
                      ? "bg-[var(--accent)] text-[var(--text-invert)]"
                      : "border border-[var(--hairline-strong)] text-[var(--text-tertiary)]",
                    revealed && isCorrect && "border-[var(--success)] text-[var(--success)]",
                    revealed && isSel && !isCorrect && "border-[var(--danger)] text-[var(--danger)]",
                  )}
                >
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 leading-snug">{opt.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div
          className="animate-fade-up mt-4 rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--surface-1)] px-3 py-2.5"
          aria-live="polite"
        >
          <p
            className={cn(
              "text-[12px] font-medium",
              selected === q.correctOptionId
                ? "text-[var(--success)]"
                : "text-[var(--danger)]",
            )}
          >
            {selected === q.correctOptionId ? "Correct" : "Not quite"}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {q.explanation}
          </p>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-3 pb-20 sm:pb-0">
        <Link
          href={`/app/courses/${courseId}/lessons/${lessonId}`}
          className="text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          Back to lesson
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          {!revealed && (
            <span className="text-[11px] text-[var(--text-tertiary)]">
              <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                1–4
              </kbd>
            </span>
          )}
          {selected && (
            <span className="text-[11px] text-[var(--text-tertiary)]">
              <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                Enter
              </kbd>
            </span>
          )}
          <Button onClick={submit} disabled={!selected}>
            {!revealed
              ? "Check"
              : index + 1 >= questions.length
                ? "See results"
                : "Next question"}
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[var(--z-raised)] border-t border-[var(--hairline)] bg-[var(--canvas)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <span className="tabular text-[12px] text-[var(--text-tertiary)]">
            Q {index + 1}/{questions.length}
          </span>
          <Button onClick={submit} disabled={!selected} size="lg">
            {!revealed
              ? "Check"
              : index + 1 >= questions.length
                ? "See results"
                : "Next question"}
          </Button>
        </div>
      </div>
    </div>
  );
}
