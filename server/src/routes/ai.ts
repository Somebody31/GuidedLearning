// GET/PATCH /v1/ai — which backend writes notes and quizzes.

import { Hono } from "hono";
import { detectBackends, type BackendId } from "../llm/detect";
import { readLlmPrefs, writeLlmPrefs } from "../llm/prefs";
import { liveLlmEnabled, requestedBackend, resolveBackend } from "../llm/resolve";
import { liveBudgetSnapshot } from "../llm/budget";
import { llmMode } from "../llm/client";
import { env } from "../env";

export const aiRoutes = new Hono();

function snapshot() {
  const backends = detectBackends();
  const resolved = resolveBackend();
  const requested = requestedBackend();
  return {
    requested,
    resolved,
    live: liveLlmEnabled(),
    mode: llmMode(),
    envBackend: env.LLM_BACKEND,
    envLocked: env.LLM_BACKEND.trim().toLowerCase() !== "auto",
    backends,
    budget: liveBudgetSnapshot(),
    prefs: readLlmPrefs(),
    allowLocalPath: env.ALLOW_LOCAL_PATH,
  };
}

aiRoutes.get("/", (c) => c.json(snapshot()));

aiRoutes.patch("/", async (c) => {
  if (env.LLM_BACKEND.trim().toLowerCase() !== "auto") {
    return c.json(
      { error: "LLM_BACKEND is set in the environment; unset it to pick from Settings." },
      409,
    );
  }
  let body: { backend?: string } = {};
  try {
    body = (await c.req.json()) as { backend?: string };
  } catch {
    body = {};
  }
  const backend = body.backend;
  const allowed: Array<BackendId | "auto"> = [
    "auto",
    "mock",
    "deepseek",
    "grok",
    "pi",
    "opencode",
  ];
  if (!backend || !allowed.includes(backend as BackendId | "auto")) {
    return c.json({ error: "backend must be auto, mock, deepseek, grok, pi, or opencode" }, 400);
  }
  if (backend !== "auto" && backend !== "mock") {
    const info = detectBackends().find((b) => b.id === backend);
    if (!info?.ready) {
      return c.json(
        { error: info?.reason || `${backend} is not ready` },
        400,
      );
    }
  }
  writeLlmPrefs(backend as BackendId | "auto");
  return c.json(snapshot());
});
