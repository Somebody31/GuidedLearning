import { describe, expect, test } from "bun:test";
import { extractJsonObject, lastTextFromNdjson } from "./spawn";

describe("extractJsonObject", () => {
  test("unwraps grok {text: '{...}'} wrappers", () => {
    const raw = JSON.stringify({
      text: '{"objectives":["a"],"sections":[{"heading":"H","body":"B"}]}',
      stopReason: "end_turn",
    });
    expect(JSON.parse(extractJsonObject(raw))).toEqual({
      objectives: ["a"],
      sections: [{ heading: "H", body: "B" }],
    });
  });

  test("reads pi --mode json NDJSON event streams", () => {
    const raw = [
      JSON.stringify({ type: "session", id: "x" }),
      JSON.stringify({ type: "agent_start" }),
      JSON.stringify({
        type: "message_update",
        assistantMessageEvent: {
          type: "text_end",
          content: '{"ok":true,"backend":"pi"}',
        },
      }),
      JSON.stringify({
        type: "turn_end",
        message: {
          role: "assistant",
          content: [{ type: "text", text: '{"ok":true,"backend":"pi"}' }],
        },
      }),
    ].join("\n");
    expect(JSON.parse(extractJsonObject(raw))).toEqual({
      ok: true,
      backend: "pi",
    });
  });

  test("reads opencode JSON event lines", () => {
    const raw = [
      JSON.stringify({ type: "step_start" }),
      JSON.stringify({
        type: "text",
        part: { type: "text", text: '{"ok":true,"backend":"opencode"}' },
      }),
    ].join("\n");
    expect(JSON.parse(extractJsonObject(raw))).toEqual({
      ok: true,
      backend: "opencode",
    });
  });
});

describe("lastTextFromNdjson", () => {
  test("returns the last assistant text part", () => {
    const raw = [
      '{"type":"session"}',
      '{"type":"text","part":{"text":"first"}}',
      '{"type":"text","part":{"text":"second"}}',
    ].join("\n");
    expect(lastTextFromNdjson(raw)).toBe("second");
  });
});
