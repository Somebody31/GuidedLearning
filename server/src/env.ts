import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  AUTH_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash-0731"),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_BASE_URL: z.string().optional(),
  EMBEDDING_MODEL: z.string().default("qwen3-embedding-8b"),
  EMBEDDING_DIMS: z.coerce.number().default(64),
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

export function liveEmbedEnabled(): boolean {
  return (
    env.USE_LIVE_AI &&
    Boolean(env.EMBEDDING_API_KEY) &&
    Boolean(env.EMBEDDING_BASE_URL)
  );
}
