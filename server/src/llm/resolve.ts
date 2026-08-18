// Pick which backend writes lessons and quizzes.

import { env } from "../env";
import {
  backendInfo,
  detectBackends,
  type BackendId,
} from "./detect";
import { readLlmPrefs } from "./prefs";

const LIVE_ORDER: BackendId[] = ["deepseek", "grok", "opencode", "pi"];

export function requestedBackend(): BackendId | "auto" {
  const fromEnv = env.LLM_BACKEND.trim().toLowerCase();
  if (fromEnv && fromEnv !== "auto") {
    return fromEnv as BackendId;
  }
  return readLlmPrefs().backend;
}

export function resolveBackend(): BackendId {
  const requested = requestedBackend();
  if (requested !== "auto") {
    if (requested === "mock") return "mock";
    return backendInfo(requested).ready ? requested : "mock";
  }

  if (!env.USE_LIVE_AI) return "mock";

  const found = detectBackends();
  for (const id of LIVE_ORDER) {
    if (found.find((b) => b.id === id)?.ready) return id;
  }
  return "mock";
}

export function liveLlmEnabled(): boolean {
  return resolveBackend() !== "mock";
}
