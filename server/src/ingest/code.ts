// Walk a copied source tree and turn files into page-like slices.

import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
  copyFile,
} from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { homedir, tmpdir } from "node:os";
import type { ParsedPage } from "../pdf/parse";
import { env } from "../env";

export const MAX_CODE_FILES = 200;
export const MAX_FILE_BYTES = 256 * 1024;
export const MAX_TREE_BYTES = 20 * 1024 * 1024;

const SKIP_DIRS = new Set([
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
  ".idea",
  ".vscode",
]);

const SKIP_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "cargo.lock",
  "poetry.lock",
  "composer.lock",
]);

const CODE_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".rb",
  ".php",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".hpp",
  ".cs",
  ".swift",
  ".scala",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".graphql",
  ".proto",
  ".vue",
  ".svelte",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".toml",
  ".yaml",
  ".yml",
  ".md",
  ".txt",
  ".r",
  ".lua",
  ".ex",
  ".exs",
  ".erl",
  ".hs",
  ".zig",
]);

const STRUCT =
  /^(export\s+)?(default\s+)?(async\s+)?(function|class|def|fn|pub\s+(async\s+)?fn|impl|interface|type|enum|struct|module)\b/;

export type CodeFile = {
  relPath: string;
  absPath: string;
  bytes: number;
};

export function isCodePath(name: string): boolean {
  const base = basename(name);
  if (SKIP_NAMES.has(base.toLowerCase())) return false;
  if (base === "Dockerfile" || base === "Makefile" || base === "CMakeLists.txt") {
    return true;
  }
  return CODE_EXT.has(extname(base).toLowerCase());
}

export function shouldSkipDir(name: string): boolean {
  return SKIP_DIRS.has(name) || name.startsWith(".");
}

export async function listCodeFiles(root: string): Promise<CodeFile[]> {
  const out: CodeFile[] = [];
  let total = 0;

  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (out.length >= MAX_CODE_FILES) return;
      if (entry.name === "." || entry.name === "..") continue;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name)) continue;
        await walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!isCodePath(entry.name)) continue;
      const st = await stat(abs);
      if (st.size <= 0 || st.size > MAX_FILE_BYTES) continue;
      if (total + st.size > MAX_TREE_BYTES) return;
      total += st.size;
      out.push({
        relPath: relative(root, abs).split(sep).join("/"),
        absPath: abs,
        bytes: st.size,
      });
    }
  }

  await walk(root);
  return out;
}

export function splitCodeToPages(text: string): ParsedPage[] {
  const clean = text.replace(/\r\n/g, "\n");
  if (!clean.trim()) {
    return [{ page: 1, text: "[Empty file]" }];
  }

  const lines = clean.split("\n");
  const cuts: number[] = [0];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const trim = line.trimStart();
    const indent = line.length - trim.length;
    if (indent > 1) continue;
    if (trim.startsWith("## ") || STRUCT.test(trim)) {
      cuts.push(i);
    }
  }
  cuts.push(lines.length);

  const unique = [...new Set(cuts)].sort((a, b) => a - b);
  if (unique.length < 3) {
    return splitByWindow(lines, 80);
  }

  const pages: ParsedPage[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    const start = unique[i]!;
    const end = unique[i + 1]!;
    const chunk = lines.slice(start, end).join("\n").trim();
    if (!chunk) continue;
    pages.push({ page: start + 1, text: chunk });
  }
  return pages.length > 0 ? pages : splitByWindow(lines, 80);
}

function splitByWindow(lines: string[], size: number): ParsedPage[] {
  const pages: ParsedPage[] = [];
  for (let i = 0; i < lines.length; i += size) {
    const chunk = lines.slice(i, i + size).join("\n").trim();
    if (!chunk) continue;
    pages.push({ page: i + 1, text: chunk });
  }
  return pages.length > 0 ? pages : [{ page: 1, text: "[Empty file]" }];
}

export async function writeBytes(
  dest: string,
  bytes: Uint8Array,
): Promise<void> {
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
}

export async function copyTreeFile(
  from: string,
  dest: string,
): Promise<void> {
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(from, dest);
}

export async function unzipTo(zipPath: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const proc = Bun.spawn(["unzip", "-o", "-q", zipPath, "-d", dest], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`unzip failed: ${stderr.slice(0, 200) || `exit ${code}`}`);
  }
}

export function assertLocalPathAllowed(input: string): string {
  if (!env.ALLOW_LOCAL_PATH) {
    throw new Error("Local folder import is disabled.");
  }
  const abs = resolve(input);
  const allowed = [resolve(homedir()), resolve(tmpdir())];
  const ok = allowed.some((root) => abs === root || abs.startsWith(root + sep));
  if (!ok) {
    throw new Error("Folder must be inside your home directory.");
  }
  return abs;
}
