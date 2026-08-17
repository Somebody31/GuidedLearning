"use client";

// Confirm the drafted unit/lesson map before studying.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { api, getCourse, wait } from "@/lib/api";
import { useCourse } from "@/lib/use-course";

export default function ConfirmCoursePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { course, loading, error, setCourse } = useCourse(id);

  const [titles, setTitles] = useState<Record<string, string>>({});
  const [booted, setBooted] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [showActivate, setShowActivate] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    document.title = "Review the path · GuidedLearning";
  }, []);

  useEffect(() => {
    if (!course || Object.keys(course.lessons).length === 0) return;
    if (booted) return;
    const init: Record<string, string> = {};
    for (const lesson of Object.values(course.lessons)) {
      init[lesson.id] = lesson.title;
    }
    setTitles(init);
    setBooted(true);
  }, [course, booted]);

  useEffect(() => {
    if (!course || Object.keys(course.lessons).length > 0) return;
    let stop = false;
    async function poll() {
      for (let i = 0; i < 40 && !stop; i++) {
        await wait(1000);
        const next = await getCourse(id);
        if (stop) return;
        if (next && Object.keys(next.lessons).length > 0) {
          setCourse(next);
          return;
        }
      }
    }
    void poll();
    return () => {
      stop = true;
    };
  }, [course, id, setCourse]);

  useEffect(() => {
    if (!booted) return;
    if (course?.lifecycle === "activated") {
      setSaveState("saved");
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      api(`/v1/courses/${id}/graph`, {
        method: "PATCH",
        body: JSON.stringify({ lessonTitles: titles }),
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 400);
    return () => clearTimeout(t);
  }, [titles, booted, id, course?.lifecycle]);

  async function activate() {
    if (activating) return;
    setActivating(true);
    try {
      if (course?.lifecycle !== "activated") {
        await api(`/v1/courses/${id}/graph`, {
          method: "PATCH",
          body: JSON.stringify({ lessonTitles: titles }),
        });
      }
      await api(`/v1/courses/${id}/activate`, { method: "POST" });
      setShowActivate(false);
      router.push(`/app/courses/${id}`);
    } catch (e) {
      setActivating(false);
      setSaveState("error");
      setShowActivate(false);
      console.error(e);
    }
  }

  useEffect(() => {
    if (!showActivate) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowActivate(false);
      if (e.key === "Enter") {
        e.preventDefault();
        void activate();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activate closes over titles
  }, [showActivate, titles, id]);

  if (loading) {
    return (
      <AppShell>
        <div className="px-6 py-16 text-center text-[14px] text-[var(--text-tertiary)]">
          Loading the path…
        </div>
      </AppShell>
    );
  }

  if (!course || error === "not-found") {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
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
      </AppShell>
    );
  }

  if (Object.keys(course.lessons).length === 0) {
    return (
      <AppShell courseId={course.id} courseTitle={course.title} activeNav="confirm">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight">
            Building the path
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Extracting units and lessons from your PDFs. This page will update
            when the draft is ready.
          </p>
        </div>
      </AppShell>
    );
  }

  const lessonCount = Object.keys(course.lessons).length;
  const unitCount = course.units.length;
  const totalMin = Object.values(course.lessons).reduce(
    (s, l) => s + (l.estMinutes ?? 0),
    0,
  );
  const emptyTitles = Object.keys(course.lessons).filter(
    (lid) => !(titles[lid] ?? course.lessons[lid]?.title ?? "").trim(),
  ).length;
  const alreadyOn = course.lifecycle === "activated";
  const canActivate =
    !alreadyOn && saveState !== "error" && emptyTitles === 0 && !activating;

  return (
    <AppShell courseId={course.id} courseTitle={course.title} activeNav="confirm">
      <div className="mx-auto max-w-4xl px-4 py-8 pb-36 sm:pb-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Review the path
            </h1>
            <p className="mt-1 max-w-xl text-[14px] text-[var(--text-tertiary)]">
              Edit titles until this matches how you want to study. The draft
              saves as you type. Tracking starts only after you confirm.
            </p>
            <p className="mt-2 tabular text-[12px] text-[var(--text-tertiary)]">
              <span className="text-[var(--text-secondary)]">{unitCount}</span>{" "}
              units ·{" "}
              <span className="text-[var(--text-secondary)]">{lessonCount}</span>{" "}
              lessons · ~{totalMin} min
            </p>
          </div>
          <div className="flex items-center gap-3">
            {alreadyOn ? (
              <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
                Tracking on
              </span>
            ) : (
              <>
                <span
                  className={
                    saveState === "error"
                      ? "inline-flex items-center rounded-full bg-[rgba(248,113,113,0.1)] px-2.5 py-1 text-[12px] font-medium text-[var(--danger)]"
                      : saveState === "saving"
                        ? "inline-flex items-center rounded-full bg-[rgba(56,189,248,0.1)] px-2.5 py-1 text-[12px] font-medium text-[var(--info)]"
                        : "inline-flex items-center rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-tertiary)]"
                  }
                >
                  {saveState === "saving" && "Draft · saving…"}
                  {saveState === "saved" && "Draft · saved"}
                  {saveState === "error" && "Couldn't save · retry"}
                </span>
                <Button
                  size="lg"
                  className="hidden sm:inline-flex"
                  disabled={!canActivate}
                  title={
                    emptyTitles > 0
                      ? `${emptyTitles} lesson title${emptyTitles === 1 ? "" : "s"} empty`
                      : saveState === "error"
                        ? "Fix save error first"
                        : undefined
                  }
                  onClick={() => setShowActivate(true)}
                >
                  Start tracking
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {course.units.map((unit) => (
            <section
              key={unit.id}
              className="plate-shell"
            >
              <div className="plate-inner p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[16px] font-semibold">{unit.title}</h2>
                <span className="tabular text-[12px] text-[var(--text-tertiary)]">
                  {unit.lessonIds.length} lessons
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {unit.lessonIds.map((lid) => (
                  <li key={lid} className="flex items-center gap-3">
                    <label className="sr-only" htmlFor={`lesson-title-${lid}`}>
                      Lesson title
                    </label>
                    <input
                      id={`lesson-title-${lid}`}
                      value={titles[lid] ?? course.lessons[lid]?.title ?? ""}
                      onChange={(e) =>
                        setTitles((prev) => ({
                          ...prev,
                          [lid]: e.target.value,
                        }))
                      }
                      aria-invalid={
                        !(titles[lid] ?? course.lessons[lid]?.title ?? "").trim()
                      }
                      className="field min-w-0 flex-1 py-2 text-[14px]"
                    />
                    <span className="tabular shrink-0 text-[12px] text-[var(--text-tertiary)]">
                      {course.lessons[lid]?.estMinutes ?? "—"} min
                    </span>
                  </li>
                ))}
              </ul>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-6 text-[13px] text-[var(--text-tertiary)]">
          <Link
            href={`/app/courses/${id}`}
            className="text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Back to today
          </Link>
          {" · "}
          You can still add sources later.
        </p>
      </div>

      <div className="fixed inset-x-3 bottom-20 z-[var(--z-raised)] pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="island mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-full px-4 py-2">
          <span className="text-[12px] text-[var(--text-tertiary)]">
            {alreadyOn
              ? "Tracking on"
              : emptyTitles > 0
                ? `${emptyTitles} empty title${emptyTitles === 1 ? "" : "s"}`
                : saveState === "saved"
                  ? "Draft saved"
                  : saveState === "saving"
                    ? "Saving…"
                    : "Save error"}
          </span>
          {alreadyOn ? (
            <Link
              href={`/app/courses/${id}`}
              className="cta-secondary"
            >
              Back to today
            </Link>
          ) : (
            <Button
              size="lg"
              disabled={!canActivate}
              onClick={() => setShowActivate(true)}
            >
              Start tracking
            </Button>
          )}
        </div>
      </div>

      {showActivate && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
          role="dialog"
          aria-modal
          aria-labelledby="activate-title"
        >
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-[var(--overlay-strong)] backdrop-blur-[2px]"
            onClick={() => setShowActivate(false)}
          />
          <div className="animate-fade-up plate-shell relative z-10 w-full max-w-md">
            <div className="plate-inner p-6">
            <h2 id="activate-title" className="text-[18px] font-semibold">
              Start tracking this path?
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Spaced review will use this structure. Lesson IDs freeze after
              you confirm.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <span className="mr-auto hidden text-[11px] text-[var(--text-tertiary)] sm:inline">
                <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                  Esc
                </kbd>{" "}
                cancel ·{" "}
                <kbd className="rounded border border-[var(--hairline)] px-1 font-mono">
                  Enter
                </kbd>{" "}
                confirm
              </span>
              <Button variant="ghost" onClick={() => setShowActivate(false)}>
                Keep editing
              </Button>
              <Button disabled={activating} onClick={() => void activate()}>
                {activating ? "Confirming…" : "Confirm"}
              </Button>
            </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
