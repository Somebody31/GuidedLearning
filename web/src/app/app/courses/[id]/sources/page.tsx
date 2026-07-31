import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCourse } from "@/lib/mock-data";

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();

  const ready = course.sources.filter((s) => s.status === "ready").length;

  return (
    <AppShell courseId={course.id} courseTitle={course.title} activeNav="sources">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">Sources</h1>
            <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
              Grounding corpus for RAG ·{" "}
              <span className="tabular text-[var(--text-secondary)]">
                {ready}/{course.sources.length}
              </span>{" "}
              ready
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Upload lands in the next backend pass"
            className="inline-flex h-9 cursor-not-allowed items-center rounded-full border border-[var(--hairline)] px-4 text-[13px] text-[var(--text-disabled)]"
          >
            Add PDF
          </button>
        </div>
        <ul className="mt-8 space-y-2">
          {course.sources.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                  {s.pages} pages
                  {s.lastUsed ? ` · last used ${s.lastUsed}` : ""}
                </p>
              </div>
              <span
                className={
                  s.status === "ready"
                    ? "rounded-full border border-[var(--success)]/30 bg-[rgba(52,211,153,0.1)] px-2.5 py-0.5 text-[12px] capitalize text-[var(--success)]"
                    : s.status === "failed"
                      ? "rounded-full border border-[var(--danger)]/30 bg-[rgba(248,113,113,0.1)] px-2.5 py-0.5 text-[12px] capitalize text-[var(--danger)]"
                      : "rounded-full border border-[var(--info)]/30 bg-[rgba(56,189,248,0.1)] px-2.5 py-0.5 text-[12px] capitalize text-[var(--info)]"
                }
              >
                {s.status}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[13px] text-[var(--text-tertiary)]">
          <Link href={`/app/courses/${id}`} className="text-[var(--accent)]">
            Back to atlas
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
