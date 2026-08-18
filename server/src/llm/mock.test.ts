import { describe, expect, test } from "bun:test";
import { mockDraftCodeGraph, mockGenerateLesson, titleFromCodePath } from "./mock";
import type { Chunk } from "../types";

describe("titleFromCodePath", () => {
  test("turns a filename into a lesson title", () => {
    expect(titleFromCodePath("src/auth/session.ts")).toBe("Session");
    expect(titleFromCodePath("userService.py")).toBe("User Service");
  });
});

describe("mockDraftCodeGraph", () => {
  test("groups files by top-level folder", () => {
    const draft = mockDraftCodeGraph({
      courseTitle: "Auth service",
      files: [
        { path: "src/auth/session.ts", bytes: 4000 },
        { path: "src/auth/password.ts", bytes: 2000 },
        { path: "lib/util.ts", bytes: 800 },
        { path: "README.md", bytes: 300 },
      ],
    });
    expect(draft.units.length).toBeGreaterThanOrEqual(2);
    const titles = Object.values(draft.lessons).map((l) => l.title);
    expect(titles).toContain("Session");
    expect(titles).toContain("Password");
  });
});

describe("mockGenerateLesson", () => {
  test("code lessons cite with a locator", () => {
    const chunk: Chunk = {
      id: "ch-1",
      courseId: "c",
      sourceId: "s",
      sourceName: "src/auth/session.ts",
      pageStart: 12,
      pageEnd: 12,
      text: "export class Session { constructor(public id: string) {} }",
      embedding: [],
    };
    const gen = mockGenerateLesson({
      title: "Session",
      retrieved: [{ chunk, score: 1 }],
      kind: "code",
    });
    expect(gen.sections[0]?.heading).toBe("From your code");
    expect(gen.citations[0]?.locator).toBe("src/auth/session.ts:12");
  });
});
