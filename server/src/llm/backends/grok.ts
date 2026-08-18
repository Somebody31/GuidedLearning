// Headless `grok -p` using the already-logged-in grok.com session.

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
  const argv = [
    env.GROK_BIN,
    "-p",
    rest || "Reply with the requested JSON.",
    "--output-format",
    "json",
    "--max-turns",
    "1",
    "--disallowed-tools",
    "run_terminal_cmd,search_replace,web_search,web_fetch,Agent",
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

  const result = await runCommand(argv);
  if (result.code !== 0) {
    throw new Error(
      `grok exited ${result.code}: ${(result.stderr || result.stdout).slice(0, 400)}`,
    );
  }
  return opts.json ? extractJsonObject(result.stdout) : result.stdout.trim();
}
