/** Pinned model ids — change here, not scattered in prompts. */

export const LLM = {
  provider: "deepseek",
  /** DeepSeek V4 Flash 0731 */
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash-0731",
  baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
} as const;

export const EMBEDDING = {
  provider: "qwen3",
  model: process.env.EMBEDDING_MODEL ?? "qwen3-embedding-8b",
  baseUrl: process.env.EMBEDDING_BASE_URL ?? "",
  /** Set once known for chosen Qwen3 size; required for pgvector column. */
  dims: process.env.EMBEDDING_DIMS
    ? Number(process.env.EMBEDDING_DIMS)
    : undefined,
} as const;
