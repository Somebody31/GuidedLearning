// Main API server. The website is a separate app at http://localhost:3000

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env, liveEmbedEnabled, liveLlmEnabled } from "./env";
import { authMiddleware } from "./middleware/auth";
import { coursesRoutes } from "./routes/courses";
import { sessionsRoutes } from "./routes/sessions";
import { LLM, EMBEDDING } from "./llm/models";
import { embeddingMode } from "./embed/qwen";
import { llmMode } from "./llm/client";
import { liveBudgetSnapshot } from "./llm/budget";
import { store, CN_COURSE_ID } from "./db/store";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Simple status object so we can see if the server is running.
function healthInfo() {
  let note = "Offline mock AI (default) — no paid API calls";
  if (env.USE_LIVE_AI && liveLlmEnabled()) {
    note = "Live AI on — lessons generate when you open them";
  } else if (env.USE_LIVE_AI) {
    note = "USE_LIVE_AI=true but DEEPSEEK_API_KEY is missing — still mock";
  }

  return {
    ok: true,
    service: "guidedlearning-server",
    store: env.DATA_STORE,
    useLiveAi: env.USE_LIVE_AI,
    llm: {
      provider: LLM.provider,
      model: LLM.model,
      mode: llmMode(),
      keyConfigured: Boolean(env.DEEPSEEK_API_KEY),
      live: liveLlmEnabled(),
    },
    embedding: {
      provider: EMBEDDING.provider,
      model: env.EMBEDDING_MODEL || EMBEDDING.model,
      mode: embeddingMode(),
      dims: env.EMBEDDING_DIMS,
      live: liveEmbedEnabled(),
      localUrl:
        env.EMBEDDING_MODE === "local" ? env.EMBEDDING_LOCAL_URL : undefined,
    },
    seedCourseId: CN_COURSE_ID,
    liveBudget: liveBudgetSnapshot(),
    note,
  };
}

// This is the API, not the website.
app.get("/", (c) => {
  return c.json({
    ok: true,
    message: "This is the API. Open the website at http://localhost:3000",
    health: "/health",
    courses: "/v1/courses",
  });
});

app.get("/health", (c) => c.json(healthInfo()));

app.use("/v1/*", authMiddleware);
app.use("/v1/*", async (c, next) => {
  await next();
  if (c.req.method !== "GET" && c.req.method !== "HEAD" && c.req.method !== "OPTIONS") {
    store.scheduleSave();
  }
});
app.route("/v1/courses", coursesRoutes);
app.route("/v1/sessions", sessionsRoutes);

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

app.onError((err, c) => {
  console.error(err);
  const exposed =
    process.env.NODE_ENV === "production"
      ? "Internal error"
      : err.message || "Internal error";
  return c.json({ error: exposed }, 500);
});

const port = env.PORT;
console.log(
  `GuidedLearning API · http://localhost:${port} · AI=${llmMode()}/${embeddingMode()} · USE_LIVE_AI=${env.USE_LIVE_AI}`,
);

export default {
  port,
  fetch: app.fetch,
};
