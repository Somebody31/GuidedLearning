// Read settings from environment variables (the .env file).
// If a value is missing, we use a simple default.

function readText(name: string, fallback: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }
  return value;
}

function readNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return fallback;
  }
  return n;
}

function readYesNo(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }
  return value === "true" || value === "1";
}

export const env = {
  PORT: readNumber("PORT", 8787),
  CORS_ORIGIN: readText("CORS_ORIGIN", "http://localhost:3000"),
  AUTH_TOKEN: process.env.AUTH_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,

  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: readText("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
  DEEPSEEK_MODEL: readText("DEEPSEEK_MODEL", "deepseek-v4-flash"),

  EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY,
  EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL,
  // mock = fake vectors, local = Python sidecar, remote = paid API
  EMBEDDING_MODE: readText("EMBEDDING_MODE", "mock") as
    | "mock"
    | "local"
    | "remote",
  EMBEDDING_LOCAL_URL: readText("EMBEDDING_LOCAL_URL", "http://127.0.0.1:8790"),
  EMBEDDING_MODEL: readText("EMBEDDING_MODEL", "Qwen/Qwen3-Embedding-0.6B"),
  EMBEDDING_DIMS: readNumber("EMBEDDING_DIMS", 1024),

  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  S3_REGION: readText("S3_REGION", "auto"),

  DATA_STORE: readText("DATA_STORE", "memory") as "memory" | "postgres",
  DATA_DIR: readText("DATA_DIR", "data"),

  // Live AI costs money. Default is off.
  USE_LIVE_AI: readYesNo("USE_LIVE_AI", false),
  LIVE_AI_MAX_OUTPUT_TOKENS: readNumber("LIVE_AI_MAX_OUTPUT_TOKENS", 400),
  LIVE_AI_MAX_CALLS: readNumber("LIVE_AI_MAX_CALLS", 8),
  // Only generate a lesson when the student opens it.
  LIVE_AI_LAZY_ONLY: readYesNo("LIVE_AI_LAZY_ONLY", true),
};

export type Env = typeof env;

// True when we should call DeepSeek.
export function liveLlmEnabled(): boolean {
  return env.USE_LIVE_AI && Boolean(env.DEEPSEEK_API_KEY);
}

// True when we should call a real embedding model.
export function liveEmbedEnabled(): boolean {
  if (env.EMBEDDING_MODE === "local") {
    return true;
  }
  if (env.EMBEDDING_MODE === "remote") {
    return Boolean(env.EMBEDDING_API_KEY) && Boolean(env.EMBEDDING_BASE_URL);
  }
  return (
    env.USE_LIVE_AI &&
    Boolean(env.EMBEDDING_API_KEY) &&
    Boolean(env.EMBEDDING_BASE_URL)
  );
}

// URL of the embedding server, or null if we use fake vectors.
export function embeddingEndpoint(): string | null {
  if (env.EMBEDDING_MODE === "local") {
    return env.EMBEDDING_LOCAL_URL.replace(/\/$/, "");
  }
  if (env.EMBEDDING_MODE === "remote" || liveEmbedEnabled()) {
    if (!env.EMBEDDING_BASE_URL) {
      return null;
    }
    return env.EMBEDDING_BASE_URL.replace(/\/$/, "");
  }
  return null;
}
