/** Pinned model ids — live calls only when USE_LIVE_AI=true. */

export const LLM = {
  provider: "deepseek",
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
  baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
} as const;

export const EMBEDDING = {
  provider: "qwen3",
  model: process.env.EMBEDDING_MODEL ?? "Qwen/Qwen3-Embedding-0.6B",
  baseUrl:
    process.env.EMBEDDING_MODE === "local"
      ? (process.env.EMBEDDING_LOCAL_URL ?? "http://127.0.0.1:8790")
      : (process.env.EMBEDDING_BASE_URL ?? ""),
  dims: process.env.EMBEDDING_DIMS
    ? Number(process.env.EMBEDDING_DIMS)
    : 1024,
} as const;
