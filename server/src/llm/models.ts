/** Pinned model ids — live calls only when USE_LIVE_AI=true. */

export const LLM = {
  provider: "deepseek",
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash-0731",
  baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
} as const;

export const EMBEDDING = {
  provider: "qwen3",
  model: process.env.EMBEDDING_MODEL ?? "qwen3-embedding-8b",
  baseUrl: process.env.EMBEDDING_BASE_URL ?? "",
  dims: process.env.EMBEDDING_DIMS
    ? Number(process.env.EMBEDDING_DIMS)
    : 64,
} as const;
