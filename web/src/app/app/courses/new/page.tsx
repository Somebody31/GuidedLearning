"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, X } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { CN_COURSE_ID } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

type FileRow = {
  id: string;
  name: string;
  size: string;
  status: "queued" | "parsing" | "ready" | "failed";
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

  const ready = files.some((f) => f.status === "ready");

  function addMockFiles() {
    setFiles((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: "Lecture-notes-upload.pdf",
        size: "2.1 MB",
        status: "parsing",
      },
    ]);
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "parsing" ? { ...f, status: "ready" } : f,
        ),
      );
    }, 1200);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
        <h1 className="text-[28px] font-semibold tracking-tight">New course</h1>
        <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
          PDFs only in v1 · textbooks and lecture slides work best
        </p>

        <label className="mt-8 block text-[13px] text-[var(--text-secondary)]">
          Course title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--surface-1)] px-3 py-2.5 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="button"
          onClick={addMockFiles}
          className="mt-6 flex w-full flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-0)] px-6 py-14 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-1)]"
        >
          <FileUp className="h-8 w-8 text-[var(--accent)]" />
          <span className="mt-3 text-[15px] font-medium">
            Drop PDFs or click to upload
          </span>
          <span className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            Demo: adds a mock parse job
          </span>
        </button>

        <ul className="mt-6 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-1)] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px]">{f.name}</p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  {f.size}
                </p>
              </div>
              <span
                className={cn(
                  "text-[12px] capitalize",
                  f.status === "ready" && "text-[var(--success)]",
                  f.status === "failed" && "text-[var(--danger)]",
                  f.status === "parsing" && "text-[var(--info)]",
                  f.status === "queued" && "text-[var(--text-tertiary)]",
                )}
              >
                {f.status}
              </span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                onClick={() =>
                  setFiles((prev) => prev.filter((x) => x.id !== f.id))
                }
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between gap-3">
          <Link
            href="/app"
            className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Cancel
          </Link>
          <Button
            size="lg"
            disabled={!ready || !title.trim()}
            onClick={() =>
              router.push(`/app/courses/${CN_COURSE_ID}/confirm`)
            }
          >
            Build course map
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
