"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/lib/mock-data";

const QUESTIONS = [
  {
    stem: "HTTP is primarily which layer?",
    options: ["Transport", "Application", "Network", "Link"],
    correct: 1,
  },
  {
    stem: "UDP provides reliable delivery.",
    options: ["True", "False"],
    correct: 1,
  },
  {
    stem: "Triple duplicate ACKs often trigger:",
    options: ["DNS refresh", "Fast retransmit", "ARP flood", "SMTP relay"],
    correct: 1,
  },
];

export default function DiagnosticPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.id);
  const course = getCourse(courseId);
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Diagnostic · GuidedLearning";
  }, []);

  function advance() {
    if (sel === null) return;
    if (i + 1 >= QUESTIONS.length) setDone(true);
    else {
      setI((x) => x + 1);
      setSel(null);
    }
  }

  useEffect(() => {
    if (done) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && sel !== null) {
        e.preventDefault();
        advance();
      }
      const n = Number(e.key);
      if (n >= 1 && n <= (QUESTIONS[i]?.options.length ?? 0)) {
        setSel(n - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advance closes over sel/i
  }, [done, sel, i]);

  if (!course) return <p className="p-8">Not found</p>;

  if (done) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-lg flex-col justify-center px-4 py-16">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          Placement applied
        </p>
        <h1 className="mt-3 text-[24px] font-semibold tracking-tight">
          Your path is ready
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Strong areas stay{" "}
          <strong className="font-medium text-[var(--text-primary)]">
            available
          </strong>{" "}
          with low pack priority — never auto-mastered. Weak areas join the weak
          queue. SRS reviews start only after real quizzes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/app/courses/${courseId}`} className="cta-primary">
            Open atlas
          </Link>
          <Link
            href={`/app/courses/${courseId}/session`}
            className="cta-secondary text-[14px] text-[var(--text-primary)]"
          >
            Start a session
          </Link>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[i];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-lg flex-col justify-center px-4 py-12">
      <div className="flex items-center justify-between text-[13px] text-[var(--text-tertiary)]">
        <span>Diagnostic</span>
        <span className="tabular">
          {i + 1}/{QUESTIONS.length}
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-[var(--duration-med)] ease-[var(--ease-out-soft)]"
          style={{
            width: `${((i + (sel !== null ? 0.5 : 0)) / QUESTIONS.length) * 100}%`,
          }}
        />
      </div>
      <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">
        Optional placement · never auto-masters strong topics
      </p>
      <h1 className="mt-4 text-[20px] font-semibold leading-snug">{q.stem}</h1>
      <ul className="mt-6 space-y-2">
        {q.options.map((o, idx) => (
          <li key={o}>
            <button
              type="button"
              onClick={() => setSel(idx)}
              className={
                sel === idx
                  ? "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--accent)] bg-[var(--accent-muted)] px-4 py-3 text-left text-[14px] transition-colors"
                  : "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3 text-left text-[14px] transition-colors hover:bg-[var(--surface-2)]"
              }
            >
              <span
                className={
                  sel === idx
                    ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-medium text-[var(--text-invert)]"
                    : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[11px] text-[var(--text-tertiary)]"
                }
              >
                {idx + 1}
              </span>
              {o}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          className="text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
          onClick={() => router.push(`/app/courses/${courseId}`)}
        >
          Skip diagnostic
        </button>
        <div className="flex items-center gap-2">
          {sel !== null && (
            <kbd className="hidden rounded border border-[var(--hairline)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline">
              Enter
            </kbd>
          )}
          <Button disabled={sel === null} onClick={advance}>
            {i + 1 >= QUESTIONS.length ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
