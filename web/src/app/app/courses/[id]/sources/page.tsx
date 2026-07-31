import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { FileStatusChip } from "@/components/ui/file-status-chip";
import { getCourse } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Sources",
};

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
        {course.sources.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-0)] px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-[var(--text-secondary)]">
              No sources yet
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              Upload lands in the next backend pass. Demo course ships with
              textbooks and lecture PDFs.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {course.sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3 transition-all duration-[var(--duration-fast)] hover:-translate-y-px hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-tertiary)]"
                  aria-hidden
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                    {s.pages} pages
                    {s.lastUsed ? ` · last used ${s.lastUsed}` : ""}
                  </p>
                </div>
                <FileStatusChip status={s.status} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-[13px] text-[var(--text-tertiary)]">
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
