import { env, liveEmbedEnabled } from "../env";
import { EMBEDDING } from "../llm/models";

/**
 * Deterministic offline embedding — free, stable for cosine retrieval demos.
 * Live Qwen3 only when USE_LIVE_AI=true and keys are set.
 */
export function mockEmbed(text: string, dims = env.EMBEDDING_DIMS): number[] {
  const v = new Array<number>(dims).fill(0);
  const s = text.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    v[i % dims]! += ((code * (i + 1)) % 97) / 97;
  }
  // bag-of-tokenish signal
  for (const tok of s.split(/[^a-z0-9]+/).filter(Boolean)) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) >>> 0;
    v[h % dims]! += 1;
  }
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / norm);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (!liveEmbedEnabled()) {
    return texts.map((t) => mockEmbed(t));
  }

  const res = await fetch(
    `${env.EMBEDDING_BASE_URL!.replace(/\/$/, "")}/embeddings`,
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
  return liveEmbedEnabled();
}

export function embeddingMode(): "mock" | "live" {
  return liveEmbedEnabled() ? "live" : "mock";
}
