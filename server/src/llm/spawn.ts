// Run a local agent CLI and return stdout.

import { env } from "../env";

export async function runCommand(
  argv: string[],
  opts?: { timeoutMs?: number; cwd?: string },
): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}> {
  const timeoutMs = opts?.timeoutMs ?? env.AGENT_TIMEOUT_MS;
  const proc = Bun.spawn(argv, {
    cwd: opts?.cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  let timedOut = false;
  const killer = setTimeout(() => {
    timedOut = true;
    try {
      proc.kill();
    } catch {
      /* already gone */
    }
  }, timeoutMs);

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(killer);

  return {
    code: code ?? 1,
    stdout,
    stderr: timedOut
      ? `${stderr}\ntimed out after ${timeoutMs}ms`.trim()
      : stderr,
    timedOut,
  };
}

export function lastTextFromNdjson(raw: string): string | null {
  let last: string | null = null;
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const ev = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof ev.text === "string" && ev.text.trim()) last = ev.text;
      const part = ev.part as { text?: string } | undefined;
      if (part && typeof part.text === "string" && part.text.trim()) {
        last = part.text;
      }
      const ame = ev.assistantMessageEvent as
        | { type?: string; content?: string }
        | undefined;
      if (ame?.type === "text_end" && typeof ame.content === "string") {
        last = ame.content;
      }
      const fromMsg = textFromMessageContent(
        (ev.message as { content?: unknown } | undefined)?.content,
      );
      if (fromMsg) last = fromMsg;
    } catch {
      /* skip non-JSON lines */
    }
  }
  return last;
}

function textFromMessageContent(content: unknown): string | null {
  if (typeof content === "string" && content.trim()) return content;
  if (!Array.isArray(content)) return null;
  const texts = content
    .filter(
      (part): part is { type: string; text: string } =>
        Boolean(part) &&
        typeof part === "object" &&
        (part as { type?: string }).type === "text" &&
        typeof (part as { text?: string }).text === "string",
    )
    .map((part) => part.text);
  return texts.at(-1) ?? null;
}

function looksLikeNdjson(raw: string): boolean {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  let parsed = 0;
  for (const line of lines.slice(0, 5)) {
    try {
      JSON.parse(line);
      parsed += 1;
    } catch {
      return false;
    }
  }
  return parsed >= 2;
}

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Agent returned empty output");

  if (looksLikeNdjson(trimmed)) {
    const fromStream = lastTextFromNdjson(trimmed);
    if (fromStream && fromStream.trim() !== trimmed) {
      return extractJsonObject(fromStream);
    }
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(body) as unknown;
    return unwrapAgentJson(parsed);
  } catch {
    /* fall through */
  }

  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = body.slice(start, end + 1);
    const parsed = JSON.parse(slice) as unknown;
    return unwrapAgentJson(parsed);
  }

  throw new Error("Agent output was not JSON");
}

function unwrapAgentJson(parsed: unknown): string {
  if (typeof parsed === "string") {
    const inner = parsed.trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
    return JSON.stringify({ text: inner });
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.text === "string" && looksLikePayload(obj.text)) {
      return obj.text.trim();
    }
    if (typeof obj.result === "string" && looksLikePayload(obj.result)) {
      return obj.result.trim();
    }
    return JSON.stringify(parsed);
  }
  throw new Error("Agent JSON was empty");
}

function looksLikePayload(s: string): boolean {
  const t = s.trim();
  return t.startsWith("{") || t.startsWith("[");
}
