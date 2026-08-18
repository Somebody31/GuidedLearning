// Persist the chosen generation backend in data/settings.json.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { env } from "../env";
import type { BackendId } from "./detect";

export type LlmPrefs = { backend: BackendId | "auto" };

const VALID = new Set<LlmPrefs["backend"]>([
  "auto",
  "mock",
  "deepseek",
  "grok",
  "pi",
  "opencode",
]);

let cache: LlmPrefs | null = null;

export function prefsPath() {
  return join(env.DATA_DIR, "settings.json");
}

export function readLlmPrefs(): LlmPrefs {
  if (cache) return cache;
  try {
    const raw = JSON.parse(readFileSync(prefsPath(), "utf8")) as {
      backend?: string;
    };
    const backend = VALID.has(raw.backend as LlmPrefs["backend"])
      ? (raw.backend as LlmPrefs["backend"])
      : "auto";
    cache = { backend };
  } catch {
    cache = { backend: "auto" };
  }
  return cache;
}

export function writeLlmPrefs(backend: LlmPrefs["backend"]): LlmPrefs {
  if (!VALID.has(backend)) {
    throw new Error(`Unknown backend: ${backend}`);
  }
  cache = { backend };
  const dest = prefsPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(cache, null, 2)}\n`);
  return cache;
}

export function resetLlmPrefsCache() {
  cache = null;
}
