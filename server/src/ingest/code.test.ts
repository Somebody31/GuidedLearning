import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "../env";
import {
  assertLocalPathAllowed,
  isCodePath,
  listCodeFiles,
  shouldSkipDir,
  splitCodeToPages,
  unzipTo,
} from "./code";

describe("isCodePath", () => {
  test("accepts source files and skips lockfiles", () => {
    expect(isCodePath("src/app.ts")).toBe(true);
    expect(isCodePath("Makefile")).toBe(true);
    expect(isCodePath("package-lock.json")).toBe(false);
    expect(isCodePath("bun.lock")).toBe(false);
    expect(isCodePath("photo.png")).toBe(false);
  });
});

describe("shouldSkipDir", () => {
  test("skips dependency and vcs folders", () => {
    expect(shouldSkipDir("node_modules")).toBe(true);
    expect(shouldSkipDir(".git")).toBe(true);
    expect(shouldSkipDir("src")).toBe(false);
  });
});

describe("splitCodeToPages", () => {
  test("cuts on top-level functions when there are enough markers", () => {
    const text = [
      "export function alpha() {",
      "  return 1",
      "}",
      "export function beta() {",
      "  return 2",
      "}",
      "export class Gamma {",
      "  n = 3",
      "}",
    ].join("\n");
    const pages = splitCodeToPages(text);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages[0]!.page).toBe(1);
    expect(pages.some((p) => p.text.includes("function beta"))).toBe(true);
  });

  test("falls back to 80-line windows when the file is a blob", () => {
    const lines = Array.from({ length: 160 }, (_, i) => `  const x${i} = ${i}`);
    const pages = splitCodeToPages(lines.join("\n"));
    expect(pages.length).toBe(2);
    expect(pages[0]!.page).toBe(1);
    expect(pages[1]!.page).toBe(81);
  });
});

describe("listCodeFiles", () => {
  test("walks a tree and ignores node_modules", async () => {
    const root = await mkdtemp(join(tmpdir(), "gl-code-"));
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, "node_modules", "pkg"), { recursive: true });
    await writeFile(join(root, "src", "app.ts"), "export const n = 1\n");
    await writeFile(join(root, "node_modules", "pkg", "index.js"), "module.exports = 1\n");
    await writeFile(join(root, "package-lock.json"), "{}\n");
    const listed = await listCodeFiles(root);
    expect(listed.map((f) => f.relPath)).toEqual(["src/app.ts"]);
  });
});

describe("unzipTo", () => {
  test("unpacks a zip of source files", async () => {
    const root = await mkdtemp(join(tmpdir(), "gl-zip-"));
    await writeFile(join(root, "hello.ts"), "export const hello = 1\n");
    const zipPath = join(root, "tree.zip");
    const packed = Bun.spawn(
      [
        "python3",
        "-c",
        "import zipfile, sys; z=zipfile.ZipFile(sys.argv[1],'w'); z.write(sys.argv[2], 'hello.ts'); z.close()",
        zipPath,
        join(root, "hello.ts"),
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    const zipCode = await packed.exited;
    if (zipCode !== 0) {
      const err = await new Response(packed.stderr).text();
      throw new Error(`could not write zip: ${err || zipCode}`);
    }
    const dest = join(root, "out");
    await unzipTo(zipPath, dest);
    const listed = await listCodeFiles(dest);
    expect(listed.some((f) => f.relPath.endsWith("hello.ts"))).toBe(true);
  });
});

describe("assertLocalPathAllowed", () => {
  test("rejects when disabled and accepts a home-dir path when on", () => {
    const prev = env.ALLOW_LOCAL_PATH;
    env.ALLOW_LOCAL_PATH = false;
    expect(() => assertLocalPathAllowed(tmpdir())).toThrow(/disabled/i);
    env.ALLOW_LOCAL_PATH = true;
    const allowed = assertLocalPathAllowed(tmpdir());
    expect(allowed.length).toBeGreaterThan(1);
    expect(() => assertLocalPathAllowed("/etc")).toThrow(/home directory/i);
    env.ALLOW_LOCAL_PATH = prev;
  });
});
