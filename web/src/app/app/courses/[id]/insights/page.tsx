// Mastery and schedule overview for a course.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { CtaLink } from "@/components/ui/cta-link";
import { Plate } from "@/components/ui/plate";
import { StateBadge } from "@/components/ui/state-badge";
import { api, getCourse } from "@/lib/api";

export const metadata: Metadata = {
  title: "Progress",
};

export const dynamic = "force-dynamic";

type InsightsPayload = {
  insights: {
    eval: { faithfulRate: number | null; note: string };
  };
};

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let course = null;
  let faithfulRate: number | null = null;
  try {
    course = await getCourse(id);
    const data = await api<InsightsPayload>(`/v1/courses/${id}/insights`);
    faithfulRate = data.insights.eval.faithfulRate;
  } catch {
    course = course;
  }
  if (!course) notFound();

  const lessons = Object.values(course.lessons);
  const due = lessons.filter((l) => l.status === "due").length;
  const weak = lessons.filter((l) => l.status === "weak").length;
  const mastered = lessons.filter((l) => l.status === "mastered").length;
  let cited = 0;
  for (const l of lessons) {
    if (l.citations.length > 0) cited += 1;
  }
  const coverage = lessons.length ? cited / lessons.length : 0;
  const faithfulness = faithfulRate ?? 0;
  const needsPack = due > 0 || weak > 0;

  return (
    <AppShell courseId={course.id} courseTitle={course.title} activeNav="progress">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Progress</h1>
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
              What needs work, and how well lessons stay grounded.
            </p>
          </div>
          {needsPack ? (
            <CtaLink href={`/app/courses/${id}/session`}>Start sitting</CtaLink>
          ) : (
            <CtaLink href={`/app/courses/${id}`} variant="secondary">
              Back to today
            </CtaLink>
          )}
        </div>

        <section className="mt-8">
          <Plate>
            <p className="text-[14px] text-[var(--text-secondary)]">
              <span className="tabular font-medium text-[var(--state-due)]">{due}</span> due
              <span className="mx-2 text-[var(--text-disabled)]">·</span>
              <span className="tabular font-medium text-[var(--state-weak)]">{weak}</span> weak
              <span className="mx-2 text-[var(--text-disabled)]">·</span>
              <span className="tabular font-medium text-[var(--state-mastered)]">{mastered}</span> mastered
            </p>
          </Plate>
        </section>

        <section className="mt-5">
          <Plate>
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
          </Plate>
        </section>

        <section className="mt-5">
          <Plate>
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
          </Plate>
        </section>

        <section className="mt-5">
          <Plate>
          <h2 className="text-[15px] font-medium">Grounding</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <dt className="text-[var(--text-secondary)]">Source coverage</dt>
              <dd className="tabular font-medium">
                {Math.round(coverage * 100)}%
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <dt className="text-[var(--text-secondary)]">
                Faithfulness sample
              </dt>
              <dd className="tabular font-medium">
                {faithfulRate === null ? "—" : `${Math.round(faithfulness * 100)}%`}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">
            Coverage = lessons with citations. Faithfulness is sampled after
            content exists — not a fake 99.9%.
          </p>
          </Plate>
        </section>

        <p className="mt-8 text-[13px]">
          <Link
            href={`/app/courses/${id}`}
            className="text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Back to today
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
