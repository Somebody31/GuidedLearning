"use client";

// List of uploaded sources for this course.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText } from "@phosphor-icons/react";
import { AppShell } from "@/components/shell/app-shell";
import { DeskPage, Plate } from "@/components/ui/plate";
import { FileStatusChip } from "@/components/ui/file-status-chip";
import { api, getCourse } from "@/lib/api";
import { courseKindOf } from "@/lib/course-utils";
import { useCourse } from "@/lib/use-course";

export default function SourcesPage() {
  const params = useParams();
  const id = String(params.id);
  const { course, loading, error, setCourse } = useCourse(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isCode = courseKindOf(course) === "code";

  useEffect(() => {
    document.title = "Sources · GuidedLearning";
  }, []);

  async function addFiles(list: FileList) {
    if (!course) return;
    const form = new FormData();
    let count = 0;
    for (const file of Array.from(list)) {
      const rel = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
      if (isCode) {
        const lower = rel.toLowerCase();
        const skip = rel
          .split("/")
          .some((part) =>
            [
              "node_modules",
              ".git",
              "dist",
              "build",
              ".next",
              "__pycache__",
            ].includes(part),
          );
        if (skip) continue;
        if (
          !lower.endsWith(".zip") &&
          !/\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|c|h|cc|cpp|hpp|cs|swift|md|txt|json|toml|yml|yaml|sql|vue|svelte|html|css)$/i.test(
            rel,
          ) &&
          !/^(Dockerfile|Makefile|CMakeLists\.txt)$/.test(
            rel.split("/").pop() ?? "",
          )
        ) {
          continue;
        }
        form.append("files", file, rel);
        count += 1;
        continue;
      }
      const name = file.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".txt") && !name.endsWith(".md")) {
        continue;
      }
      form.append("files", file);
      count += 1;
    }
    if (count === 0) {
      setUploadError(
        isCode
          ? "Use a source folder, a .zip, or a code file."
          : "Use a .pdf, .txt, or .md file.",
      );
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
            Desk
          </Link>
        </div>
      </AppShell>
    );
  }

  const ready = course.sources.filter((s) => s.status === "ready").length;

  return (
    <AppShell courseId={course.id} courseTitle={course.title} activeNav="sources">
      <DeskPage width="read">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Sources</h1>
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
              {isCode
                ? `${course.sources.length} files this course is grounded in`
                : "Files this course is grounded in"}{" "}
              ·{" "}
              <span className="tabular">
                {ready}/{course.sources.length}
              </span>{" "}
              ready
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={
              isCode
                ? ".zip,application/zip,.ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.md,.txt,.json"
                : "application/pdf,.pdf,.txt,.md,text/plain,text/markdown"
            }
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={dirRef}
            type="file"
            multiple
            className="sr-only"
            {...({
              webkitdirectory: "",
              directory: "",
            } as Record<string, string>)}
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            {isCode ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => dirRef.current?.click()}
                className="inline-flex h-9 items-center rounded-full border border-[var(--hairline)] px-4 text-[13px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
              >
                {busy ? "Uploading…" : "Add folder"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center rounded-full border border-[var(--hairline)] px-4 text-[13px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
            >
              {busy ? "Uploading…" : isCode ? "Add files" : "Add PDF"}
            </button>
          </div>
        </div>
        {uploadError ? (
          <p className="mt-4 text-[13px] text-[var(--danger)]">{uploadError}</p>
        ) : null}
        {course.sources.length === 0 ? (
          <Plate className="mt-8" innerClassName="px-6 py-12 text-center">
            <p className="text-[15px] font-medium">No sources yet</p>
            <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
              {isCode
                ? "Add a folder or zip to ground lessons in this tree."
                : "Add a PDF to ground lessons for this subject."}
            </p>
          </Plate>
        ) : (
          <Plate className="mt-8" innerClassName="p-2 md:p-3">
            <ul>
              {course.sources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-3"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-tertiary)]"
                    aria-hidden
                  >
                    <FileText size={16} weight="regular" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                      {isCode ? `${s.pages} slices` : `${s.pages} pages`}
                      {s.lastUsed ? ` · last used ${s.lastUsed}` : ""}
                    </p>
                  </div>
                  <FileStatusChip status={s.status} />
                </li>
              ))}
            </ul>
          </Plate>
        )}
        <p className="mt-8 text-[13px] text-[var(--text-tertiary)]">
          <Link
            href={`/app/courses/${id}`}
            className="text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Back to today
          </Link>
        </p>
      </DeskPage>
    </AppShell>
  );
}
