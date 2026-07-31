"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { StateBadge } from "@/components/ui/state-badge";
import { getCourse, unitForLesson } from "@/lib/mock-data";
import { applyPrefsAttrs, readPrefs } from "@/lib/prefs";
import { cn } from "@/lib/cn";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.id);
  const lessonId = String(params.lessonId);
  const course = getCourse(courseId);
  const lesson = course?.lessons[lessonId];
  const unit = course ? unitForLesson(course, lessonId) : undefined;
  const [paper, setPaper] = useState(false);
  const [sourceOpen, setSourceOpen] = useState<string | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [readPct, setReadPct] = useState(0);

  useEffect(() => {
    const p = readPrefs();
    applyPrefsAttrs(p);
    setPaper(p.paperDefault);
  }, []);

  useEffect(() => {
    if (lesson) {
      document.title = `${lesson.title} · GuidedLearning`;
    }
  }, [lesson]);

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

  useEffect(() => {
    if (!lesson || sourceOpen) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setPaper((prev) => {
          setFlipping(true);
          window.setTimeout(() => setFlipping(false), 220);
          return !prev;
        });
      }
      if (
        (e.key === "q" || e.key === "Q") &&
        lesson?.quizReady &&
        (lesson.quiz?.length ?? 0) > 0
      ) {
        e.preventDefault();
        router.push(`/app/courses/${courseId}/lessons/${lessonId}/quiz`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, sourceOpen, courseId, lessonId, router]);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setReadPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lessonId]);

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
          className="cta-primary mt-2"
        >
          Back to atlas
        </Link>
      </div>
    );
  }

  function togglePaper() {
    // Snap theme immediately so screenshots/audit never catch a mid-lerp gray.
    // Overlay only provides a brief flash transition.
    const next = !paper;
    setPaper(next);
    setFlipping(true);
    window.setTimeout(() => setFlipping(false), 220);
  }

  return (
    <div
      className={cn(
        "relative min-h-full",
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
            background: paper ? "var(--paper)" : "var(--canvas)",
            animation: "paper-fade 220ms var(--ease-out-soft) forwards",
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
              "inline-flex items-center gap-1.5 text-[13px] transition-colors",
              paper
                ? "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
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
              title="Toggle paper mode (P)"
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
        <div
          className={cn(
            "h-0.5 w-full",
            paper ? "bg-[var(--paper-line)]" : "bg-[var(--surface-3)]",
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(readPct)}
          aria-label="Reading progress"
        >
          <div
            className={cn(
              "h-full transition-[width] duration-100 ease-out",
              paper ? "bg-[var(--paper-accent)]" : "bg-[var(--accent)]",
            )}
            style={{ width: `${readPct}%` }}
          />
        </div>
      </header>

      <article className="mx-auto max-w-[42rem] px-4 py-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
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
                    "inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1 font-mono text-[12px] tabular transition-colors",
                    paper
                      ? "border-[var(--paper-line)] text-[var(--paper-accent)] hover:bg-[var(--paper-surface)]"
                      : "border-[var(--hairline)] bg-[var(--accent-muted)] text-[var(--accent)] hover:border-[var(--accent)]/40",
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
      </article>

      <footer
        className={cn(
          "fixed inset-x-0 bottom-0 z-[var(--z-raised)] flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          paper
            ? "border-[var(--paper-line)] bg-[var(--paper)]"
            : "border-[var(--hairline)] bg-[var(--canvas)]",
        )}
      >
        <div className="mx-auto flex w-full max-w-[42rem] flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSourceOpen(lesson.citations[0]?.id ?? null)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-[13px] transition-colors",
              paper
                ? "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Open sources</span>
          </button>
          <div className="flex items-center gap-2">
            {lesson.quizReady && lesson.quiz.length > 0 ? (
              <>
                <span className="hidden text-[11px] text-[var(--text-tertiary)] sm:inline">
                  <kbd
                    className={cn(
                      "rounded border px-1 font-mono",
                      paper
                        ? "border-[var(--paper-line)]"
                        : "border-[var(--hairline)]",
                    )}
                  >
                    Q
                  </kbd>
                </span>
                <Link
                  href={`/app/courses/${courseId}/lessons/${lessonId}/quiz`}
                  className="paper-cta cta-primary"
                >
                  Take quiz →
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-full border border-[var(--hairline)] px-5 text-[14px] text-[var(--text-tertiary)]"
                disabled
              >
                Quiz not ready · retry later
              </button>
            )}
          </div>
        </div>
      </footer>

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
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[1px]"
            onClick={() => setSourceOpen(null)}
          />
          <div className="animate-sheet-in relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--hairline)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sheet)]">
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
            <div className="mt-5 flex-1 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-0)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] text-[var(--accent)]">
                    {citation.sourceName}
                  </p>
                  <p className="mt-1 tabular text-[12px] text-[var(--text-tertiary)]">
                    Page {citation.page}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--hairline)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                  Grounded
                </span>
              </div>
              <p className="lesson-serif mt-4 text-[15px] leading-relaxed text-[var(--text-primary)]">
                {citation.excerpt ??
                  "Text layer excerpt would appear here from the PDF pipeline. Figures are referenced by page only (no invented diagram vision)."}
              </p>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-tertiary)]">
              Grounded snippet from the parse pipeline — not model invention.
              Full PDF page render lands with the backend.
            </p>
            <Link
              href={`/app/courses/${courseId}/sources`}
              className="mt-4 text-[13px] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              View all sources →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
