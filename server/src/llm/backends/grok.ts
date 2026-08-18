// Headless `grok -p` using the already-logged-in grok.com session.

import { tmpdir } from "node:os";
import { env } from "../../env";
import { extractJsonObject, runCommand } from "../spawn";
import type { ChatMessage } from "../messages";

const JSON_OBJECT_SCHEMA = JSON.stringify({ type: "object" });

function splitMessages(messages: ChatMessage[]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const rest = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
    .join("\n\n");
  return { system, rest };
}

export async function grokComplete(opts: {
  messages: ChatMessage[];
  json?: boolean;
}): Promise<string> {
  const { system, rest } = splitMessages(opts.messages);
  // Run outside the GuidedLearning repo. From this tree grok treats
  // "README" as a file to open and burns its turn on read_file.
  const isolatedCwd = tmpdir();
  const argv = [
    env.GROK_BIN,
    "-p",
    rest || "Reply with the requested JSON.",
    "--cwd",
    isolatedCwd,
    "--output-format",
    "json",
    "--max-turns",
    "2",
    "--tools",
    "",
    "--disable-web-search",
  ];
  if (system) {
    argv.push("--system-prompt-override", system);
  }
  if (opts.json) {
    argv.push("--json-schema", JSON_OBJECT_SCHEMA);
  }
  if (env.GROK_MODEL) {
    argv.push("-m", env.GROK_MODEL);
  }

  const result = await runCommand(argv, { cwd: isolatedCwd });
  if (result.timedOut) {
    throw new Error(`grok timed out after ${env.AGENT_TIMEOUT_MS}ms`);
  }
  if (result.code !== 0) {
    if (opts.json) {
      try {
        return extractJsonObject(result.stdout);
      } catch {
        /* fall through to the CLI error */
      }
    }
    throw new Error(
      `grok exited ${result.code}: ${(result.stderr || result.stdout).slice(0, 400)}`,
    );
  }
  return opts.json ? extractJsonObject(result.stdout) : result.stdout.trim();
}
