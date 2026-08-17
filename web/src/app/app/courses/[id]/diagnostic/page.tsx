"use client";

// Short placement quiz when you first activate a course.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CtaLink } from "@/components/ui/cta-link";
import { Plate } from "@/components/ui/plate";
import { api } from "@/lib/api";

type DiagItem = {
  lessonId: string;
  stem: string;
  options: { id: string; text: string }[];
};

const CHOICE: Record<string, "strong" | "ok" | "weak" | "skip"> = {
  a: "strong",
  b: "ok",
  c: "weak",
  d: "skip",
};

export default function DiagnosticPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.id);

  const [items, setItems] = useState<DiagItem[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [placements, setPlacements] = useState<
    { lessonId: string; choice: "strong" | "ok" | "weak" | "skip" }[]
  >([]);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = done
      ? "Placement applied · GuidedLearning"
      : "Placement · GuidedLearning";
  }, [done]);

  useEffect(() => {
    let cancelled = false;
    api<{ items: DiagItem[] }>(`/v1/courses/${courseId}/diagnostic/start`, {
      method: "POST",
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to start";
        setLoadError(msg.includes("not found") ? "not-found" : msg);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function finish(
    nextPlacements: {
      lessonId: string;
      choice: "strong" | "ok" | "weak" | "skip";
    }[],
  ) {
    setSaving(true);
    try {
      await api(`/v1/courses/${courseId}/diagnostic/submit`, {
        method: "POST",
        body: JSON.stringify({ placements: nextPlacements }),
      });
    } catch {
      /* still show the summary */
    }
    setPlacements(nextPlacements);
    setDone(true);
    setSaving(false);
  }

  function advance() {
    if (sel === null || !items) return;
    const q = items[i];
    const choice = CHOICE[sel] ?? "skip";
    const next = [...placements, { lessonId: q.lessonId, choice }];
    if (i + 1 >= items.length) {
      void finish(next);
    } else {
      setPlacements(next);
      setI((x) => x + 1);
      setSel(null);
    }
  }

  useEffect(() => {
    if (done || !items) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && sel !== null) {
        e.preventDefault();
        advance();
      }
      const n = Number(e.key);
      const q = items?.[i];
      if (q && n >= 1 && n <= q.options.length) {
        setSel(q.options[n - 1]!.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advance closes over sel/i
  }, [done, sel, i, items]);

  if (loadError === "not-found") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          404
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Course not found
        </h1>
        <Link href="/app" className="cta-primary mt-2">
          Desk
        </Link>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="px-6 py-20 text-center text-[14px] text-[var(--text-tertiary)]">
        {loadError || "Loading placement…"}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-lg flex-col justify-center px-4 py-16">
        <h1 className="text-[22px] font-semibold tracking-tight">
          No lessons to place yet
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          Confirm a path first, then come back.
        </p>
        <CtaLink href={`/app/courses/${courseId}`} className="mt-6">
          Open today
        </CtaLink>
      </div>
    );
  }

  if (done) {
    let ready = 0;
    let weak = 0;
    for (const p of placements) {
      if (p.choice === "strong" || p.choice === "ok") ready += 1;
      if (p.choice === "weak") weak += 1;
    }
    return (
      <div className="animate-fade-up mx-auto flex min-h-[calc(100dvh-2rem)] max-w-lg flex-col justify-center px-4 py-16">
        <p className="text-[12px] font-medium text-[var(--accent)]">
          Placement applied
        </p>
        <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.025em]">
          Your path is ready
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Strong areas stay ready with low sitting priority — never
          auto-mastered. Weak areas join the practice queue. Reviews start only
          after real quizzes.
        </p>
        <Plate className="mt-6">
          <div className="flex justify-between text-[14px]">
            <span className="text-[var(--text-secondary)]">Ready</span>
            <span className="tabular font-medium text-[var(--accent)]">
              {ready}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
            Later in today
          </p>
          <div className="mt-4 flex justify-between border-t border-[var(--hairline)] pt-4 text-[14px]">
            <span className="text-[var(--text-secondary)]">Needs practice</span>
            <span className="tabular font-medium text-[var(--state-weak)]">
              {weak}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
            Sit these first
          </p>
        </Plate>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaLink href={`/app/courses/${courseId}`}>Open today</CtaLink>
          <Link
            href={`/app/courses/${courseId}/session`}
            className="cta-secondary text-[14px] text-[var(--text-primary)]"
          >
            Start a sitting
          </Link>
        </div>
      </div>
    );
  }

  const q = items[i];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-lg flex-col justify-center px-4 py-12">
      <div className="flex items-center justify-between text-[13px] text-[var(--text-tertiary)]">
        <span>Placement</span>
        <span className="tabular">
          {i + 1}/{items.length}
        </span>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={i + (sel !== null ? 1 : 0)}
        aria-label="Placement progress"
      >
        <div
          className="h-full bg-[var(--accent)] transition-all duration-[var(--duration-med)] ease-[var(--ease-out-soft)]"
          style={{
            width: `${((i + (sel !== null ? 0.5 : 0)) / items.length) * 100}%`,
          }}
        />
      </div>
      <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">
        Optional · never auto-masters a topic
      </p>
      <h1
        key={q.lessonId}
        className="animate-fade-up mt-4 text-[20px] font-semibold leading-snug"
      >
        {q.stem}
      </h1>
      <ul className="mt-6 space-y-2" role="listbox" aria-label="Answers">
        {q.options.map((o, idx) => (
          <li key={o.id}>
            <button
              type="button"
              role="option"
              aria-selected={sel === o.id}
              onClick={() => setSel(o.id)}
              className={
                sel === o.id
                  ? "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--accent)] bg-[var(--accent-muted)] px-4 py-3 text-left text-[14px] shadow-[0_0_0_1px_var(--accent-ring)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]"
                  : "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3 text-left text-[14px] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
              }
            >
              <span
                className={
                  sel === o.id
                    ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-medium text-[var(--text-invert)]"
                    : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[11px] text-[var(--text-tertiary)]"
                }
              >
                {idx + 1}
              </span>
              {o.text}
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
          Skip placement
        </button>
        <div className="flex items-center gap-2">
          <kbd className="hidden rounded border border-[var(--hairline)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline">
            1–{q.options.length}
          </kbd>
          <Button disabled={sel === null || saving} onClick={advance}>
            {i + 1 >= items.length ? "See placement" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
