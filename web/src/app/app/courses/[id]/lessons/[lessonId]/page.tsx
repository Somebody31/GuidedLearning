"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { StateBadge } from "@/components/ui/state-badge";
import { getCourse, unitForLesson } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

export default function LessonPage() {
  const params = useParams();
  const courseId = String(params.id);
  const lessonId = String(params.lessonId);
  const course = getCourse(courseId);
  const lesson = course?.lessons[lessonId];
  const unit = course ? unitForLesson(course, lessonId) : undefined;
  const [paper, setPaper] = useState(false);
  const [sourceOpen, setSourceOpen] = useState<string | null>(null);
  const [flipping, setFlipping] = useState(false);

  const citation = useMemo(() => {
    if (!lesson || !sourceOpen) return null;
    return lesson.citations.find((c) => c.id === sourceOpen) ?? null;
  }, [lesson, sourceOpen]);

  if (!course || !lesson || !unit) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8">
        <p className="text-[var(--text-secondary)]">Lesson missing · back to atlas</p>
        <Link href={`/app/courses/${courseId}`} className="text-[var(--accent)]">
          Atlas
        </Link>
      </div>
    );
  }

  function togglePaper() {
    setFlipping(true);
    setTimeout(() => {
      setPaper((p) => !p);
      setFlipping(false);
    }, 280);
  }

  return (
    <div
      className={cn(
        "relative min-h-full transition-colors duration-[320ms]",
        paper ? "paper-mode" : "bg-[var(--canvas)] text-[var(--text-primary)]",
      )}
    >
      {flipping && (
        <div
          className="pointer-events-none fixed inset-0 z-[var(--z-theme)] bg-[var(--canvas)]"
          style={{ animation: "fade 300ms var(--ease-out-soft)" }}
        />
      )}

      <header
        className={cn(
          "sticky top-0 z-[var(--z-raised)] border-b backdrop-blur-md",
          paper
            ? "border-[var(--paper-line)] bg-[var(--paper)]/90"
            : "border-[var(--hairline)] bg-[var(--canvas)]/90",
        )}
      >
        <div className="mx-auto flex h-14 max-w-[42rem] items-center justify-between gap-3 px-4">
          <Link
            href={`/app/courses/${courseId}`}
            className={cn(
              "inline-flex items-center gap-1.5 text-[13px]",
              paper ? "text-[var(--paper-muted)]" : "text-[var(--text-tertiary)]",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>
          <div className="flex items-center gap-3">
            <MasteryRing value={lesson.mastery} size={24} />
            <StateBadge status={lesson.status} />
            <button
              type="button"
              onClick={togglePaper}
              className={cn(
                "text-[12px]",
                paper ? "text-[var(--paper-accent)]" : "text-[var(--text-tertiary)]",
              )}
            >
              {paper ? "Dark" : "Paper"}
            </button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-[42rem] px-4 py-10">
        <p
          className={cn(
            "text-[12px] uppercase tracking-[0.08em]",
            paper ? "text-[var(--paper-muted)]" : "text-[var(--text-tertiary)]",
          )}
        >
          {unit.title}
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight leading-tight">
          {lesson.title}
        </h1>
        <p
          className={cn(
            "mt-2 tabular text-[13px]",
            paper ? "text-[var(--paper-muted)]" : "text-[var(--text-tertiary)]",
          )}
        >
          {lesson.estMinutes} min · reading keeps in progress · quiz completes
        </p>

        <section className="mt-8">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] opacity-70">
            Objectives
          </h2>
          <ul className="lesson-serif mt-3 list-disc space-y-1.5 pl-5 text-[17px] leading-relaxed">
            {lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>

        {lesson.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-[18px] font-semibold">{s.heading}</h2>
            <p className="lesson-serif mt-3 text-[18px] leading-[1.65]">{s.body}</p>
          </section>
        ))}

        {lesson.citations.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] opacity-70">
              Citations
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {lesson.citations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSourceOpen(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[12px] tabular",
                    paper
                      ? "border-[var(--paper-line)] text-[var(--paper-accent)]"
                      : "border-[var(--hairline)] text-[var(--accent)] bg-[var(--accent-muted)]",
                  )}
                >
                  {c.sourceName} · p.{c.page}
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t pt-6 border-[var(--hairline)]">
          <button
            type="button"
            onClick={() =>
              setSourceOpen(lesson.citations[0]?.id ?? null)
            }
            className={cn(
              "inline-flex items-center gap-2 text-[13px]",
              paper ? "text-[var(--paper-muted)]" : "text-[var(--text-secondary)]",
            )}
          >
            <BookOpen className="h-4 w-4" />
            Open sources
          </button>
          {lesson.quizReady && lesson.quiz.length > 0 ? (
            <Link
              href={`/app/courses/${courseId}/lessons/${lessonId}/quiz`}
              className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)] hover:bg-[var(--accent-hover)]"
            >
              Take quiz →
            </Link>
          ) : (
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full border border-[var(--hairline)] px-5 text-[14px] text-[var(--text-tertiary)]"
              disabled
            >
              Quiz not ready · retry later
            </button>
          )}
        </footer>
      </article>

      {citation && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex justify-end bg-black/50"
          role="dialog"
          aria-modal
        >
          <div className="flex h-full w-full max-w-md flex-col border-l border-[var(--hairline)] bg-[var(--surface-1)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-medium">Source preview</h3>
              <button
                type="button"
                className="text-[13px] text-[var(--text-tertiary)]"
                onClick={() => setSourceOpen(null)}
              >
                Close
              </button>
            </div>
            <p className="mt-4 font-mono text-[12px] text-[var(--accent)]">
              {citation.sourceName} · p.{citation.page}
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {citation.excerpt ??
                "Text layer excerpt would appear here from the PDF pipeline. Figures are referenced by page only (no invented diagram vision)."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
