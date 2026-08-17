"use client";

// Upload PDFs and build a course for any subject.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, UploadSimple, X } from "@phosphor-icons/react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import {
  FileStatusChip,
  type FileParseStatus,
} from "@/components/ui/file-status-chip";
import { DeskPage, Plate } from "@/components/ui/plate";
import { api, wait } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Course } from "@/lib/types";

type FileRow = {
  id: string;
  file: File;
  status: FileParseStatus;
};

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewCoursePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [dropHot, setDropHot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "New course · GuidedLearning";
  }, []);

  const readyCount = files.filter((f) => f.status !== "failed").length;
  const canBuild = readyCount > 0 && Boolean(title.trim()) && !busy;

  function addPdfs(list: FileList | File[]) {
    const incoming = Array.from(list);
    const next: FileRow[] = [];
    for (const file of incoming) {
      const name = file.name.toLowerCase();
      if (
        !name.endsWith(".pdf") &&
        !name.endsWith(".txt") &&
        !name.endsWith(".md")
      ) {
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        status: "queued",
      });
    }
    if (next.length === 0) {
      setError("Use a .pdf, .txt, or .md file.");
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...next]);
  }

  async function buildPath() {
    if (!canBuild) return;
    setBusy(true);
    setError("");
    try {
      const created = await api<{ course: Course }>("/v1/courses", {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });
      const courseId = created.course.id;

      const form = new FormData();
      for (const row of files) {
        form.append("files", row.file);
      }
      await api(`/v1/courses/${courseId}/sources`, {
        method: "POST",
        body: form,
      });
      setFiles((prev) => prev.map((row) => ({ ...row, status: "parsing" })));

      let sourcesReady = false;
      for (let i = 0; i < 60; i++) {
        const data = await api<{ course: Course }>(`/v1/courses/${courseId}`);
        const sources = data.course.sources;
        let ready = 0;
        let failed = 0;
        for (const source of sources) {
          if (source.status === "ready") ready += 1;
          if (source.status === "failed") failed += 1;
        }
        setFiles((prev) =>
          prev.map((row) => {
            const match = sources.find((s) => s.name === row.file.name);
            if (!match) return row;
            return { ...row, status: match.status };
          }),
        );
        if (sources.length > 0 && ready + failed === sources.length) {
          if (ready === 0) {
            throw new Error(
              "The PDF could not be parsed. Try a text-based PDF.",
            );
          }
          sourcesReady = true;
          break;
        }
        await wait(800);
      }
      if (!sourcesReady) {
        throw new Error("Timed out waiting for PDFs to parse.");
      }

      await api(`/v1/courses/${courseId}/build`, { method: "POST" });

      for (let i = 0; i < 60; i++) {
        const data = await api<{ course: Course }>(`/v1/courses/${courseId}`);
        if (Object.keys(data.course.lessons).length > 0) {
          router.push(`/app/courses/${courseId}/confirm`);
          return;
        }
        await wait(800);
      }
      throw new Error("Timed out building the course path.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Build failed");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <DeskPage width="narrow" className="pb-28 sm:pb-16">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em] md:text-[2rem]">
          New course
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          Any subject. PDFs of textbooks and lecture slides work best.
        </p>

        <Plate className="mt-8">
          <label className="block text-[13px] text-[var(--text-secondary)]">
            <span className="flex items-center justify-between gap-2">
              <span>Course title</span>
              <span
                className={cn(
                  "tabular text-[11px]",
                  title.length >= 72
                    ? "text-[var(--warning)]"
                    : "text-[var(--text-tertiary)]",
                )}
              >
                {title.length}/80
              </span>
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic Chemistry"
              autoComplete="off"
              maxLength={80}
              disabled={busy}
              className="field mt-1.5"
            />
          </label>
          {files.length > 0 && !title.trim() ? (
            <p className="mt-1.5 text-[12px] text-[var(--warning)]" role="alert">
              Add a title before building the path
            </p>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf,.txt,.md,text/plain,text/markdown"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addPdfs(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDropHot(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDropHot(true);
            }}
            onDragLeave={() => setDropHot(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropHot(false);
              if (e.dataTransfer.files) addPdfs(e.dataTransfer.files);
            }}
            className={cn(
              "mt-6 flex w-full flex-col items-center justify-center rounded-[var(--radius-xl)] px-6 py-12 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
              dropHot
                ? "bg-[var(--accent-muted)]"
                : "bg-[var(--surface-0)] hover:bg-[var(--surface-2)]",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                dropHot ? "bg-[var(--accent)]/15" : "bg-[var(--accent-muted)]",
              )}
            >
              <UploadSimple
                size={20}
                weight="light"
                className="text-[var(--accent)]"
              />
            </span>
            <span className="mt-3 text-[15px] font-medium">
              Drop PDFs or click to upload
            </span>
            <span className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              .pdf, .txt, or .md · any subject
            </span>
          </button>
        </Plate>

        {files.length > 0 ? (
          <div className="mt-6">
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Sources ·{" "}
              <span className="tabular text-[var(--text-secondary)]">
                {files.filter((f) => f.status === "ready").length}/{files.length}
              </span>{" "}
              ready
              {busy ? (
                <span className="text-[var(--info)]"> · working…</span>
              ) : null}
            </p>
            <ul className="mt-3 space-y-2">
              {files.map((f) => (
                <li key={f.id}>
                  <Plate innerClassName="flex items-center gap-3 p-3 md:p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-tertiary)]"
                      aria-hidden
                    >
                      <FileText size={16} weight="light" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">
                        {f.file.name}
                      </p>
                      <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                        {fileSize(f.file.size)}
                        {f.status === "parsing" ? " · extracting text" : null}
                      </p>
                    </div>
                    <FileStatusChip status={f.status} />
                    <button
                      type="button"
                      aria-label={`Remove ${f.file.name}`}
                      disabled={busy}
                      className="rounded-full p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-40"
                      onClick={() =>
                        setFiles((prev) => prev.filter((x) => x.id !== f.id))
                      }
                    >
                      <X size={16} weight="light" />
                    </button>
                  </Plate>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-6 text-[13px] text-[var(--text-tertiary)]">
            Drop at least one file to unlock Build.
          </p>
        )}

        {error ? (
          <p className="mt-4 text-[13px] text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-10 hidden items-center justify-between gap-3 sm:flex">
          <Link
            href="/app"
            className="text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
          >
            Cancel
          </Link>
          <Button
            size="lg"
            disabled={!canBuild}
            title={
              !title.trim()
                ? "Add a course title"
                : readyCount === 0
                  ? "Add at least one PDF"
                  : busy
                    ? "Building…"
                    : undefined
            }
            onClick={() => void buildPath()}
          >
            {busy ? "Building the path…" : "Build the path"}
          </Button>
        </div>
      </DeskPage>

      <div className="fixed inset-x-3 bottom-3 z-[var(--z-raised)] pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="island flex items-center justify-between gap-3 rounded-full px-4 py-2">
          <Link href="/app" className="text-[13px] text-[var(--text-tertiary)]">
            Cancel
          </Link>
          <Button
            size="lg"
            disabled={!canBuild}
            onClick={() => void buildPath()}
          >
            {busy ? "Building…" : "Build the path"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
