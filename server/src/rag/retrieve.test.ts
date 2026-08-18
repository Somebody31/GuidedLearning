import { describe, expect, test } from "bun:test";
import type { Chunk } from "../types";
import { codePathBoost, retrieveChunks } from "./retrieve";

function chunk(sourceName: string, text: string, id: string): Chunk {
  return {
    id,
    courseId: "c1",
    sourceId: `src-${id}`,
    sourceName,
    pageStart: 1,
    pageEnd: 1,
    text,
    embedding: [],
  };
}

describe("codePathBoost", () => {
  test("rewards a matching basename", () => {
    const hit = chunk(
      "auth/session.ts",
      "export class Session {}",
      "a",
    );
    const miss = chunk(
      "docs/notes.md",
      "A session is a conversation. Session Session Session.",
      "b",
    );
    const q = "Session";
    const tokens = ["session"];
    expect(codePathBoost(q, tokens, hit)).toBeGreaterThan(
      codePathBoost(q, tokens, miss),
    );
  });
});

describe("retrieveChunks", () => {
  test("prefers auth/session.ts for a Session query", async () => {
    const chunks = [
      chunk(
        "docs/overview.md",
        "The product has a Session concept mentioned in passing several times. Session notes.",
        "notes",
      ),
      chunk(
        "auth/session.ts",
        "export class Session {\n  constructor(public userId: string) {}\n}",
        "impl",
      ),
    ];
    const hits = await retrieveChunks("Session", chunks, 2, { code: true });
    expect(hits[0]?.chunk.sourceName).toBe("auth/session.ts");
  });
});
