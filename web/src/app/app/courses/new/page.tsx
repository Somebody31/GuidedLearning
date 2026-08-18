"use client";

// Upload PDFs or a code folder and build a course.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, FolderSimple, UploadSimple, X } from "@phosphor-icons/react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import {
  FileStatusChip,
  type FileParseStatus,
} from "@/components/ui/file-status-chip";
import { DeskPage, Plate } from "@/components/ui/plate";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { api, wait } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { AiSnapshot, Course, CourseKind, SourceFile } from "@/lib/types";

type FileRow = {
  id: string;
  file: File;
  relPath: string;
  status: FileParseStatus;
};

const SKIP_DIR = new Set([
  ".git",
  ".hg",
  ".svn",
  ".next",
  ".turbo",
  ".cache",
  ".venv",
  "venv",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "vendor",
  "coverage",
  "__pycache__",
]);

const CODE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|c|h|cc|cpp|hpp|cs|swift|scala|sh|bash|zsh|sql|graphql|proto|vue|svelte|html|css|scss|json|toml|yaml|yml|md|txt|r|lua|ex|exs|erl|hs|zig)$/i;

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeOf(file: File) {
  const rel = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
  return rel.replace(/^\/+/, "");
}

function skippedRel(rel: string) {
  return rel.split("/").some((part) => SKIP_DIR.has(part) || part === ".git");
}

function isZipName(name: string) {
  return name.toLowerCase().endsWith(".zip");
}

function isDocName(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".pdf") || lower.endsWith(".txt") || lower.endsWith(".md");
}

function isCodeName(name: string) {
  const base = name.split("/").pop() ?? name;
  if (
    base === "Dockerfile" ||
    base === "Makefile" ||
    base === "CMakeLists.txt"
  ) {
    return true;
  }
  return CODE_EXT.test(base);
}

export default function NewCoursePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<CourseKind>("document");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [localPath, setLocalPath] = useState("");
  const [allowLocalPath, setAllowLocalPath] = useState(false);
  const [dropHot, setDropHot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "New course · GuidedLearning";
  }, []);

  useEffect(() => {
    let stop = false;
    api<AiSnapshot>("/v1/ai")
      .then((snap) => {
        if (!stop) setAllowLocalPath(snap.allowLocalPath);
      })
      .catch(() => {
        if (!stop) setAllowLocalPath(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  const readyCount = files.filter((f) => f.status !== "failed").length;
  const hasLocal = kind === "code" && allowLocalPath && Boolean(localPath.trim());
  const canBuild =
    (readyCount > 0 || hasLocal) && Boolean(title.trim()) && !busy;

  function switchKind(next: CourseKind) {
    if (next === kind) return;
    setKind(next);
    setFiles([]);
    setLocalPath("");
    setError("");
  }

  function addDocuments(list: FileList | File[]) {
    const incoming = Array.from(list);
    const next: FileRow[] = [];
    for (const file of incoming) {
      if (!isDocName(file.name)) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        relPath: file.name,
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

  function addCode(list: FileList | File[]) {
    const incoming = Array.from(list);
    const next: FileRow[] = [];
    for (const file of incoming) {
      const rel = relativeOf(file);
      if (isZipName(file.name)) {
        if (file.size > 20 * 1024 * 1024) continue;
        next.push({
          id: `${rel}-${file.size}-${file.lastModified}`,
          file,
          relPath: file.name,
          status: "queued",
        });
        continue;
      }
      if (skippedRel(rel)) continue;
      if (!isCodeName(rel)) continue;
      if (file.size > 256 * 1024) continue;
      next.push({
        id: `${rel}-${file.size}-${file.lastModified}`,
        file,
        relPath: rel,
        status: "queued",
      });
    }
    if (next.length === 0) {
      setError("Use a source folder, a .zip, or supported code files.");
      return;
    }
    setError("");
    setFiles((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > 200) {
        setError("Folder is too large — using the first 200 files.");
        return merged.slice(0, 200);
      }
      return merged;
    });
  }

  function addIncoming(list: FileList | File[]) {
    if (kind === "code") addCode(list);
    else addDocuments(list);
  }

  async function buildPath() {
    if (!canBuild) return;
    setBusy(true);
    setError("");
    try {
      const created = await api<{ course: Course }>("/v1/courses", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), kind }),
      });
      const courseId = created.course.id;

      if (hasLocal) {
        await api(`/v1/courses/${courseId}/sources/from-path`, {
          method: "POST",
          body: JSON.stringify({ path: localPath.trim() }),
        });
      } else {
        const form = new FormData();
        for (const row of files) {
          form.append("files", row.file, row.relPath);
        }
        await api(`/v1/courses/${courseId}/sources`, {
          method: "POST",
          body: form,
        });
      }
      setFiles((prev) => prev.map((row) => ({ ...row, status: "parsing" })));

      let sourcesReady = false;
      let lastSources: SourceFile[] = [];
      for (let i = 0; i < 80; i++) {
        const data = await api<{ course: Course }>(`/v1/courses/${courseId}`);
        const sources = data.course.sources;
        lastSources = sources;
        let ready = 0;
        let failed = 0;
        for (const source of sources) {
          if (source.status === "ready") ready += 1;
          if (source.status === "failed") failed += 1;
        }
        setFiles((prev) => {
          if (prev.length === 0 || sources.length > prev.length) {
            return sources.map((s) => ({
              id: s.id,
              file: new File([], s.name),
              relPath: s.name,
              status: s.status,
            }));
          }
          return prev.map((row) => {
            const match = sources.find(
              (s) => s.name === row.relPath || s.name.endsWith(row.file.name),
            );
            if (!match) return row;
            return { ...row, status: match.status };
          });
        });
        if (sources.length > 0 && ready + failed === sources.length) {
          if (ready === 0) {
            throw new Error(
              kind === "code"
                ? "The folder could not be parsed. Try a smaller tree of text sources."
                : "The PDF could not be parsed. Try a text-based PDF.",
            );
          }
          sourcesReady = true;
          break;
        }
        await wait(800);
      }
      if (!sourcesReady) {
        throw new Error(
          lastSources.length === 0
            ? "Timed out waiting for files to upload."
            : kind === "code"
              ? "Timed out waiting for the folder to parse."
              : "Timed out waiting for PDFs to parse.",
        );
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
          {kind === "code"
            ? "A folder of source files. We draft lessons from the tree, then quiz you on it."
            : "Any subject. PDFs of textbooks and lecture slides work best."}
        </p>

        <div className="mt-6">
          <SegmentedControl
            ariaLabel="Course type"
            value={kind}
            onChange={(v) => switchKind(v)}
            options={[
              { value: "document", label: "Documents" },
              { value: "code", label: "Code" },
            ]}
          />
        </div>

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
              placeholder={
                kind === "code" ? "e.g. Auth service" : "e.g. Organic Chemistry"
              }
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
            accept={
              kind === "code"
                ? ".zip,application/zip,.ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.md,.txt,.json"
                : "application/pdf,.pdf,.txt,.md,text/plain,text/markdown"
            }
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addIncoming(e.target.files);
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
              if (e.target.files) addIncoming(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              kind === "code"
                ? dirRef.current?.click()
                : inputRef.current?.click()
            }
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
              if (e.dataTransfer.files) addIncoming(e.dataTransfer.files);
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
              {kind === "code" ? (
                <FolderSimple
                  size={20}
                  weight="light"
                  className="text-[var(--accent)]"
                />
              ) : (
                <UploadSimple
                  size={20}
                  weight="light"
                  className="text-[var(--accent)]"
                />
              )}
            </span>
            <span className="mt-3 text-[15px] font-medium">
              {kind === "code"
                ? "Drop a folder or zip, or click to choose"
                : "Drop PDFs or click to upload"}
            </span>
            <span className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              {kind === "code"
                ? "Up to 200 files · 256KB each · 20MB"
                : ".pdf, .txt, or .md · any subject"}
            </span>
          </button>

          {kind === "code" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => dirRef.current?.click()}
                className="inline-flex h-8 items-center rounded-full border border-[var(--hairline)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
              >
                Choose folder
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-8 items-center rounded-full border border-[var(--hairline)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
              >
                Files or zip
              </button>
            </div>
          ) : null}

          {kind === "code" && allowLocalPath ? (
            <label className="mt-5 block text-[13px] text-[var(--text-secondary)]">
              Or a folder already on this computer
              <input
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/home/you/projects/my-app"
                autoComplete="off"
                disabled={busy}
                className="field mt-1.5 font-mono text-[13px]"
              />
              <span className="mt-1.5 block text-[12px] text-[var(--text-tertiary)]">
                Copied locally from your home directory. No GuidedLearning API
                key needed.
              </span>
            </label>
          ) : null}
        </Plate>

        {files.length > 0 ? (
          <div className="mt-6">
            <p className="text-[13px] text-[var(--text-tertiary)]">
              {kind === "code" ? "Files" : "Sources"} ·{" "}
              <span className="tabular text-[var(--text-secondary)]">
                {files.filter((f) => f.status === "ready").length}/{files.length}
              </span>{" "}
              ready
              {busy ? (
                <span className="text-[var(--info)]"> · working…</span>
              ) : null}
            </p>
            <ul className="mt-3 space-y-2">
              {files.slice(0, 40).map((f) => (
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
                        {f.relPath}
                      </p>
                      <p className="tabular text-[12px] text-[var(--text-tertiary)]">
                        {f.file.size > 0 ? fileSize(f.file.size) : "uploaded"}
                        {f.status === "parsing" ? " · extracting text" : null}
                      </p>
                    </div>
                    <FileStatusChip status={f.status} />
                    <button
                      type="button"
                      aria-label={`Remove ${f.relPath}`}
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
            {files.length > 40 ? (
              <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
                +{files.length - 40} more
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-6 text-[13px] text-[var(--text-tertiary)]">
            {kind === "code"
              ? hasLocal
                ? "A local folder is set. Add a title, then build."
                : "Drop a folder or zip to unlock Build."
              : "Drop at least one file to unlock Build."}
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
                : readyCount === 0 && !hasLocal
                  ? kind === "code"
                    ? "Add a folder or zip"
                    : "Add at least one PDF"
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
