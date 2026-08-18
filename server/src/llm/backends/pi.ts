// Headless `pi --print` using whatever provider pi is already logged into.

import { env } from "../../env";
import { extractJsonObject, runCommand } from "../spawn";
import type { ChatMessage } from "../messages";

function splitMessages(messages: ChatMessage[]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const rest = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n\n");
  return { system, rest };
}

export async function piComplete(opts: {
  messages: ChatMessage[];
  json?: boolean;
}): Promise<string> {
  const { system, rest } = splitMessages(opts.messages);
  const argv = [env.PI_BIN, "--print", "--no-tools", "--no-session"];
  if (opts.json) argv.push("--mode", "json");
  if (system) argv.push("--system-prompt", system);
  if (env.PI_MODEL) argv.push("--model", env.PI_MODEL);
  argv.push(rest || "Reply with the requested JSON.");

  const result = await runCommand(argv);
  if (result.code !== 0) {
    throw new Error(
      `pi exited ${result.code}: ${(result.stderr || result.stdout).slice(0, 400)}`,
    );
  }
  return opts.json ? extractJsonObject(result.stdout) : result.stdout.trim();
}
