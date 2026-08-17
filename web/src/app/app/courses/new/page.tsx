"use client";

// Upload PDFs and start a new course (demo UI).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, FileUp, X } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import {
  FileStatusChip,
  type FileParseStatus,
} from "@/components/ui/file-status-chip";
import { CN_COURSE_ID } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

type FileRow = {
  id: string;
  name: string;
  size: string;
  status: FileParseStatus;
};

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("Computer Networks");
  const [files, setFiles] = useState<FileRow[]>([
    {
      id: "1",
      name: "Kurose-Ross-ch3-transport.pdf",
      size: "4.2 MB",
      status: "ready",
    },
    {
      id: "2",
      name: "Lecture-05-TCP.pdf",
      size: "1.8 MB",
      status: "ready",
    },
  ]);
  const [dropHot, setDropHot] = useState(false);

  useEffect(() => {
    document.title = "New course · GuidedLearning";
  }, []);

  const readyCount = files.filter((f) => f.status === "ready").length;
  const parsing = files.some((f) => f.status === "parsing");
  const canBuild = readyCount > 0 && !parsing && Boolean(title.trim());

  function addMockFiles() {
    const id = String(Date.now());
    setFiles((prev) => [
      ...prev,
      {
        id,
        name: "Lecture-notes-upload.pdf",
        size: "2.1 MB",
        status: "parsing",
      },
    ]);
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id && f.status === "parsing"
            ? { ...f, status: "ready" }
            : f,
        ),
      );
    }, 1200);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 pb-28 sm:pb-10 md:px-6">
        <h1 className="text-[28px] font-semibold tracking-tight">New course</h1>
        <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
          PDFs only in v1 · textbooks and lecture slides work best
        </p>

        <label className="mt-8 block text-[13px] text-[var(--text-secondary)]">
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
            placeholder="e.g. Computer Networks"
            autoComplete="off"
            maxLength={80}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--surface-1)] px-3 py-2.5 text-[15px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-muted)]"
          />
        </label>
        {!title.trim() ? (
          <p className="mt-1.5 text-[12px] text-[var(--warning)]" role="alert">
            Add a title before building the map
          </p>
        ) : null}

        <button
          type="button"
          onClick={addMockFiles}
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
            addMockFiles();
          }}
          className={cn(
            "mt-6 flex w-full flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed px-6 py-14 transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
            dropHot
              ? "border-[var(--accent)] bg-[var(--accent-muted)] scale-[1.01]"
              : "border-[var(--hairline-strong)] bg-[var(--surface-0)] hover:border-[var(--accent)] hover:bg-[var(--surface-1)]",
          )}
        >
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
              dropHot ? "bg-[var(--accent)]/20" : "bg-[var(--accent-muted)]",
            )}
          >
            <FileUp className="h-5 w-5 text-[var(--accent)]" />
          </span>
          <span className="mt-3 text-[15px] font-medium">
            Drop PDFs or click to upload
          </span>
          <span className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            Demo: adds a mock parse job
          </span>
        </button>

        {files.length > 0 ? (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[13px] text-[var(--text-tertiary)]">
                Sources ·{" "}
                <span className="tabular text-[var(--text-secondary)]">
                  {readyCount}/{files.length}
                </span>{" "}
                ready
                {parsing ? (
                  <span className="text-[var(--info)]"> · parsing…</span>
                ) : null}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-1)] px-3 py-2.5 transition-colors hover:border-[var(--hairline-strong)]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-tertiary)]"
                    aria-hidden
                  >
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{f.name}</p>
                    <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                      {f.size}
                      {f.status === "parsing" ? " · extracting text" : null}
                    </p>
                  </div>
                  <FileStatusChip status={f.status} />
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                    onClick={() =>
                      setFiles((prev) => prev.filter((x) => x.id !== f.id))
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-6 text-[13px] text-[var(--text-tertiary)]">
            No sources yet — drop at least one PDF to unlock Build.
          </p>
        )}

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
                  ? "Add at least one ready PDF"
                  : parsing
                    ? "Wait for parsing to finish"
                    : undefined
            }
            onClick={() =>
              router.push(`/app/courses/${CN_COURSE_ID}/confirm`)
            }
          >
            {parsing ? "Parsing sources…" : "Build course map"}
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[var(--z-raised)] border-t border-[var(--hairline)] bg-[var(--canvas)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link
            href="/app"
            className="text-[13px] text-[var(--text-tertiary)]"
          >
            Cancel
          </Link>
          <Button
            size="lg"
            disabled={!canBuild}
            onClick={() =>
              router.push(`/app/courses/${CN_COURSE_ID}/confirm`)
            }
          >
            {parsing ? "Parsing…" : "Build course map"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
