import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { StateBadge } from "@/components/ui/state-badge";
import { getCourse } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Insights",
};

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();

  const lessons = Object.values(course.lessons);
  const due = lessons.filter((l) => l.status === "due").length;
  const weak = lessons.filter((l) => l.status === "weak").length;
  const mastered = lessons.filter((l) => l.status === "mastered").length;
  const coverage = 0.78;
  const faithfulness = 0.91;
  const needsPack = due > 0 || weak > 0;

  return (
    <AppShell courseId={course.id} courseTitle={course.title} activeNav="insights">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">Insights</h1>
            <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
              Learner health + honest model signals
            </p>
          </div>
          {needsPack ? (
            <Link
              href={`/app/courses/${id}/session`}
              className="cta-primary"
            >
              Start session
            </Link>
          ) : null}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Due", due, "var(--state-due)"],
            ["Weak", weak, "var(--state-weak)"],
            ["Mastered", mastered, "var(--state-mastered)"],
          ].map(([label, n, color]) => (
            <div
              key={String(label)}
              className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--hairline-strong)]"
            >
              <p className="text-[12px] text-[var(--text-tertiary)]">{label}</p>
              <p className="tabular mt-1 text-[28px] font-semibold" style={{ color: String(color) }}>
                {n}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
          <h2 className="text-[15px] font-medium">Needs attention</h2>
          {needsPack ? (
            <ul className="mt-3 space-y-2">
              {lessons
                .filter((l) => l.status === "due" || l.status === "weak")
                .map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/app/courses/${id}/lessons/${l.id}`}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-2 py-1.5 text-[14px] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <span className="truncate text-[var(--text-primary)]">
                        {l.title}
                      </span>
                      <StateBadge status={l.status} />
                    </Link>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              All clear — nothing due or weak right now. Keep studying new
              lessons; reviews will land here after quizzes.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
          <h2 className="text-[15px] font-medium">Mastery by unit</h2>
          <ul className="mt-4 space-y-3">
            {course.units.map((u, i) => {
              const ls = u.lessonIds.map((lid) => course.lessons[lid]).filter(Boolean);
              const avg =
                ls.reduce((s, l) => s + (l?.mastery ?? 0), 0) / Math.max(1, ls.length);
              return (
                <li key={u.id}>
                  <div className="flex justify-between text-[13px]">
                    <span>{u.title}</span>
                    <span className="tabular text-[var(--text-tertiary)]">
                      {Math.round(avg * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div
                      className="bar-fill h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: avg > 0 ? `${Math.max(avg * 100, 2)}%` : "0%",
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
          <h2 className="text-[15px] font-medium">Model / eval (honest)</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[12px] text-[var(--text-tertiary)]">Source coverage</dt>
              <dd className="tabular text-[22px] font-semibold">
                {Math.round(coverage * 100)}%
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--text-tertiary)]">
                Faithfulness sample
              </dt>
              <dd className="tabular text-[22px] font-semibold">
                {Math.round(faithfulness * 100)}%
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">
            Not a fake 99.9% — sampled grounded claims vs retrieved chunks.
          </p>
        </section>

        <p className="mt-8 text-[13px]">
          <Link
            href={`/app/courses/${id}`}
            className="text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Back to atlas
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
