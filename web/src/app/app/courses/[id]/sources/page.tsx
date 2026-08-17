"use client";

// List of uploaded PDFs for this course.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { FileStatusChip } from "@/components/ui/file-status-chip";
import { api, getCourse } from "@/lib/api";
import { useCourse } from "@/lib/use-course";

export default function SourcesPage() {
  const params = useParams();
  const id = String(params.id);
  const { course, loading, error, setCourse } = useCourse(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    document.title = "Sources · GuidedLearning";
  }, []);

  async function addPdfs(list: FileList) {
    if (!course) return;
    const form = new FormData();
    let count = 0;
    for (const file of Array.from(list)) {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".txt") && !name.endsWith(".md")) {
        continue;
      }
      form.append("files", file);
      count += 1;
    }
    if (count === 0) {
      setUploadError("Use a .pdf, .txt, or .md file.");
      return;
    }
    setBusy(true);
    setUploadError("");
    try {
      await api(`/v1/courses/${id}/sources`, { method: "POST", body: form });
      const next = await getCourse(id);
      if (next) setCourse(next);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-6 py-16 text-center text-[14px] text-[var(--text-tertiary)]">
          Loading sources…
        </div>
      </AppShell>
    );
  }

  if (!course || error === "not-found") {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight">
            Course not found
          </h1>
          <Link href="/app" className="cta-primary mt-2">
            Library
          </Link>
        </div>
      </AppShell>
    );
  }

  const ready = course.sources.filter((s) => s.status === "ready").length;

  return (
    <AppShell courseId={course.id} courseTitle={course.title} activeNav="sources">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">Sources</h1>
            <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
              Grounding corpus for this course ·{" "}
              <span className="tabular text-[var(--text-secondary)]">
                {ready}/{course.sources.length}
              </span>{" "}
              ready
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf,.txt,.md,text/plain,text/markdown"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void addPdfs(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-9 items-center rounded-full border border-[var(--hairline)] px-4 text-[13px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Add PDF"}
          </button>
        </div>
        {uploadError ? (
          <p className="mt-4 text-[13px] text-[var(--danger)]">{uploadError}</p>
        ) : null}
        {course.sources.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-0)] px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-[var(--text-secondary)]">
              No sources yet
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              Add a PDF to ground lessons for this subject.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {course.sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3 transition-all duration-[var(--duration-fast)] hover:-translate-y-px hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-card)]"
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
