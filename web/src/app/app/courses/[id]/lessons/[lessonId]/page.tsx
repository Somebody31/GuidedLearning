"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!sourceOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSourceOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sourceOpen]);

  if (!course || !lesson || !unit) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          404
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Lesson missing
        </h1>
        <p className="max-w-sm text-[14px] text-[var(--text-secondary)]">
          This lesson is not in the course map. It may have been renamed or not
          yet activated.
        </p>
        <Link
          href={`/app/courses/${courseId}`}
          className="mt-2 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)] transition-colors hover:bg-[var(--accent-hover)]"
        >
          Back to atlas
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
      style={
        paper
          ? { background: "var(--paper)", color: "var(--paper-ink)" }
          : undefined
      }
    >
      {flipping && (
        <div
          className="pointer-events-none fixed inset-0 z-[var(--z-theme)]"
          style={{
            background: paper ? "var(--canvas)" : "var(--paper)",
            animation: "paper-fade 280ms var(--ease-out-soft)",
          }}
        />
      )}

      <header
        className={cn(
          "sticky top-0 z-[var(--z-raised)] border-b",
          paper
            ? "border-[var(--paper-line)] bg-[var(--paper)]"
            : "border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-md",
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
              aria-pressed={paper}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                paper
                  ? "border-[var(--paper-line)] bg-[var(--paper-surface)] text-[var(--paper-accent)]"
                  : "border-[var(--hairline)] text-[var(--text-tertiary)] hover:border-[var(--hairline-strong)] hover:text-[var(--text-secondary)]",
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
                  title={`${c.sourceName} · p.${c.page}`}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1 font-mono text-[12px] tabular",
                    paper
                      ? "border-[var(--paper-line)] text-[var(--paper-accent)]"
                      : "border-[var(--hairline)] bg-[var(--accent-muted)] text-[var(--accent)]",
                  )}
                >
                  <span className="min-w-0 max-w-[11rem] truncate sm:max-w-[18rem]">
                    {c.sourceName}
                  </span>
                  <span className="shrink-0">· p.{c.page}</span>
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
          className="fixed inset-0 z-[var(--z-modal)] flex justify-end"
          role="dialog"
          aria-modal
          aria-labelledby="source-preview-title"
        >
          <button
            type="button"
            aria-label="Dismiss source preview"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setSourceOpen(null)}
          />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--hairline)] bg-[var(--surface-1)] p-5 shadow-[-16px_0_48px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <h3 id="source-preview-title" className="text-[15px] font-medium">
                Source preview
              </h3>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                onClick={() => setSourceOpen(null)}
              >
                <span aria-hidden>Close</span>
                <kbd
                  aria-hidden
                  className="hidden rounded border border-[var(--hairline)] px-1 font-mono text-[10px] sm:inline"
                >
                  Esc
                </kbd>
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
