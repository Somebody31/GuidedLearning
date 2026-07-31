import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  AUTH_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_BASE_URL: z.string().optional(),
  /**
   * mock | local | remote
   * - mock: free hash vectors (no model)
   * - local: OpenAI-compatible sidecar (default URL http://127.0.0.1:8790)
   * - remote: EMBEDDING_BASE_URL + EMBEDDING_API_KEY
   */
  EMBEDDING_MODE: z.enum(["mock", "local", "remote"]).default("mock"),
  EMBEDDING_LOCAL_URL: z.string().default("http://127.0.0.1:8790"),
  /** HF id / display name — local default is Qwen3-Embedding-0.6B */
  EMBEDDING_MODEL: z.string().default("Qwen/Qwen3-Embedding-0.6B"),
  /** Expected dims (0.6B full=1024; MRL truncate supported by sidecar) */
  EMBEDDING_DIMS: z.coerce.number().default(1024),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  DATA_STORE: z.enum(["memory", "postgres"]).default("memory"),
  DATA_DIR: z.string().default("data"),
  /**
   * Live AI is OFF by default to avoid spending credits.
   * Set USE_LIVE_AI=true AND provide keys to call DeepSeek / Qwen3.
   */
  USE_LIVE_AI: z
    .enum(["true", "false", "1", "0"])
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  /** Cap DeepSeek output tokens per request (keep low to save cost). */
  LIVE_AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(2048).default(400),
  /** Hard stop: max live chat calls per server process, then fall back to mock. */
  LIVE_AI_MAX_CALLS: z.coerce.number().int().min(0).max(500).default(8),
  /**
   * When true (default), never bulk-generate a whole course with live AI.
   * Lessons/quizzes only call the API when a user opens that lesson.
   */
  LIVE_AI_LAZY_ONLY: z
    .enum(["true", "false", "1", "0"])
    .default("true")
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();

export function liveLlmEnabled(): boolean {
  return env.USE_LIVE_AI && Boolean(env.DEEPSEEK_API_KEY);
}

/** True when embeddings hit a real model (local sidecar or remote API). */
export function liveEmbedEnabled(): boolean {
  if (env.EMBEDDING_MODE === "local") return true;
  if (env.EMBEDDING_MODE === "remote") {
    return Boolean(env.EMBEDDING_API_KEY) && Boolean(env.EMBEDDING_BASE_URL);
  }
  // legacy: remote when USE_LIVE_AI + keys, without explicit mode
  return (
    env.USE_LIVE_AI &&
    Boolean(env.EMBEDDING_API_KEY) &&
    Boolean(env.EMBEDDING_BASE_URL)
  );
}

export function embeddingEndpoint(): string | null {
  if (env.EMBEDDING_MODE === "local") {
    return env.EMBEDDING_LOCAL_URL.replace(/\/$/, "");
  }
  if (env.EMBEDDING_MODE === "remote" || liveEmbedEnabled()) {
    return env.EMBEDDING_BASE_URL?.replace(/\/$/, "") ?? null;
  }
  return null;
}
