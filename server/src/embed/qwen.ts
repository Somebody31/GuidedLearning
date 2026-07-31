import { embeddingEndpoint, env, liveEmbedEnabled } from "../env";
import { EMBEDDING } from "../llm/models";

/**
 * Deterministic offline embedding — free, stable for cosine retrieval demos.
 * Local/remote Qwen via OpenAI-compatible /v1/embeddings when configured.
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

export type EmbedInputType = "document" | "query";

export async function embedTexts(
  texts: string[],
  opts?: { inputType?: EmbedInputType },
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const endpoint = embeddingEndpoint();
  if (!endpoint || env.EMBEDDING_MODE === "mock") {
    return texts.map((t) => mockEmbed(t));
  }

  try {
    return await embedViaHttp(endpoint, texts, opts?.inputType ?? "document");
  } catch (err) {
    console.warn("embedding backend failed, falling back to mock:", err);
    return texts.map((t) => mockEmbed(t));
  }
}

async function embedViaHttp(
  base: string,
  texts: string[],
  inputType: EmbedInputType,
): Promise<number[][]> {
  const url = base.endsWith("/embeddings")
    ? base
    : `${base}/v1/embeddings`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (env.EMBEDDING_API_KEY) {
    headers.Authorization = `Bearer ${env.EMBEDDING_API_KEY}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: env.EMBEDDING_MODEL || EMBEDDING.model,
      input: texts,
      input_type: inputType,
    }),
  });

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

export function embeddingMode(): "mock" | "local" | "remote" {
  if (env.EMBEDDING_MODE === "local") return "local";
  if (env.EMBEDDING_MODE === "remote") return "remote";
  // legacy remote when keys present under USE_LIVE_AI
  if (liveEmbedEnabled() && env.EMBEDDING_BASE_URL) return "remote";
  return "mock";
}
