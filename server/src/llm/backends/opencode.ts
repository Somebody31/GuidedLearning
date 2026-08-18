// Headless `opencode run`. Defaults to a free hosted model so no GL key is needed.

import { env } from "../../env";
import { extractJsonObject, runCommand } from "../spawn";
import type { ChatMessage } from "../messages";

function flatten(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
    .join("\n\n");
}

function lastTextFromEvents(stdout: string): string {
  const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
  const texts: string[] = [];
  for (const line of lines) {
    try {
      const ev = JSON.parse(line) as Record<string, unknown>;
      if (typeof ev.text === "string") texts.push(ev.text);
      const part = ev.part as { text?: string } | undefined;
      if (part && typeof part.text === "string") texts.push(part.text);
      const msg = ev.message as { content?: string } | undefined;
      if (msg && typeof msg.content === "string") texts.push(msg.content);
    } catch {
      /* ignore non-JSON lines */
    }
  }
  if (texts.length > 0) return texts[texts.length - 1]!;
  return stdout;
}

export async function opencodeComplete(opts: {
  messages: ChatMessage[];
  json?: boolean;
}): Promise<string> {
  const argv = [
    env.OPENCODE_BIN,
    "run",
    "--format",
    "json",
    "-m",
    env.OPENCODE_MODEL,
    flatten(opts.messages),
  ];

  const result = await runCommand(argv);
  if (result.code !== 0) {
    throw new Error(
      `opencode exited ${result.code}: ${(result.stderr || result.stdout).slice(0, 400)}`,
    );
  }
  const text = lastTextFromEvents(result.stdout);
  return opts.json ? extractJsonObject(text) : text.trim();
}
