"use client";

import { useState } from "react";
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

  if (!course) return <p className="p-8">Not found</p>;

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-[24px] font-semibold">Placement applied</h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          Strong areas stay <strong className="text-[var(--text-primary)]">available</strong> with
          low pack priority — never auto-mastered. Weak areas join the weak queue.
          SRS reviews start only after real quizzes.
        </p>
        <Link
          href={`/app/courses/${courseId}`}
          className="mt-8 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)]"
        >
          Open atlas
        </Link>
      </div>
    );
  }

  const q = QUESTIONS[i];

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="flex justify-between text-[13px] text-[var(--text-tertiary)]">
        <span>Diagnostic</span>
        <span className="tabular">
          {i + 1}/{QUESTIONS.length}
        </span>
      </div>
      <h1 className="mt-6 text-[20px] font-semibold">{q.stem}</h1>
      <ul className="mt-6 space-y-2">
        {q.options.map((o, idx) => (
          <li key={o}>
            <button
              type="button"
              onClick={() => setSel(idx)}
              className={
                sel === idx
                  ? "w-full rounded-[var(--radius-lg)] border border-[var(--accent)] bg-[var(--accent-muted)] px-4 py-3 text-left text-[14px]"
                  : "w-full rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3 text-left text-[14px]"
              }
            >
              {o}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          className="text-[13px] text-[var(--text-tertiary)]"
          onClick={() => router.push(`/app/courses/${courseId}`)}
        >
          Skip diagnostic
        </button>
        <Button
          disabled={sel === null}
          onClick={() => {
            if (i + 1 >= QUESTIONS.length) setDone(true);
            else {
              setI((x) => x + 1);
              setSel(null);
            }
          }}
        >
          {i + 1 >= QUESTIONS.length ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
