// Run a local agent CLI and return stdout.

import { env } from "../env";

export async function runCommand(
  argv: string[],
  opts?: { timeoutMs?: number; cwd?: string },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const timeoutMs = opts?.timeoutMs ?? env.AGENT_TIMEOUT_MS;
  const proc = Bun.spawn(argv, {
    cwd: opts?.cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const killer = setTimeout(() => {
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

  return { code: code ?? 1, stdout, stderr };
}

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Agent returned empty output");

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
