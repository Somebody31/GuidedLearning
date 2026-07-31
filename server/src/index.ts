import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env";
import { authMiddleware } from "./middleware/auth";
import { coursesRoutes } from "./routes/courses";
import { LLM, EMBEDDING } from "./llm/models";
import { embeddingConfigured } from "./embed/qwen";
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
    llm: {
      provider: LLM.provider,
      model: LLM.model,
      keyConfigured: Boolean(env.DEEPSEEK_API_KEY),
    },
    embedding: {
      provider: EMBEDDING.provider,
      model: EMBEDDING.model,
      configured: embeddingConfigured(),
      dims: EMBEDDING.dims ?? null,
    },
    seedCourseId: CN_COURSE_ID,
  }),
);

app.use("/v1/*", authMiddleware);
app.route("/v1/courses", coursesRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || "Internal error" }, 500);
});

const port = env.PORT;
console.log(
  `GuidedLearning API · http://localhost:${port} · store=${env.DATA_STORE} · llm=${LLM.model}`,
);

export default {
  port,
  fetch: app.fetch,
};
