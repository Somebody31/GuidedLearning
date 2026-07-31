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
import { CN_COURSE_ID } from "./db/store";

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

app.get("/health", (c) =>
  c.json({
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
      model: EMBEDDING.model,
      mode: embeddingMode(),
      dims: env.EMBEDDING_DIMS,
      live: liveEmbedEnabled(),
    },
    seedCourseId: CN_COURSE_ID,
    liveBudget: liveBudgetSnapshot(),
    note: env.USE_LIVE_AI
      ? liveLlmEnabled()
        ? "Live AI on — lazy lesson/quiz only, hard call+token caps (see liveBudget)"
        : "USE_LIVE_AI=true but DEEPSEEK_API_KEY missing — still mock"
      : "Offline mock AI (default) — no paid API calls",
  }),
);

app.use("/v1/*", authMiddleware);
app.route("/v1/courses", coursesRoutes);
app.route("/v1/sessions", sessionsRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || "Internal error" }, 500);
});

const port = env.PORT;
console.log(
  `GuidedLearning API · http://localhost:${port} · AI=${llmMode()}/${embeddingMode()} · USE_LIVE_AI=${env.USE_LIVE_AI}`,
);

export default {
  port,
  fetch: app.fetch,
};
