import { env } from "../env";
import { EMBEDDING } from "../llm/models";

/**
 * Qwen3 Embedding client.
 * Provider URL is env-specific (DashScope / OpenRouter / Ollama / other OpenAI-compatible).
 * B1+ wiring; B0 only validates config shape.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (!env.EMBEDDING_API_KEY || !env.EMBEDDING_BASE_URL) {
    throw new Error(
      "EMBEDDING_API_KEY and EMBEDDING_BASE_URL required for Qwen3 embeddings",
    );
  }

  const res = await fetch(
    `${env.EMBEDDING_BASE_URL.replace(/\/$/, "")}/embeddings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.EMBEDDING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING.model,
        input: texts,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedding error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    data?: { embedding: number[]; index: number }[];
  };
  if (!data.data?.length) throw new Error("Embedding response empty");

  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export function embeddingConfigured(): boolean {
  return Boolean(env.EMBEDDING_API_KEY && env.EMBEDDING_BASE_URL);
}
