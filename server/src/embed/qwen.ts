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
  opts?: { inputType?: EmbedInputType; allowMockFallback?: boolean },
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const endpoint = embeddingEndpoint();
  if (!endpoint || env.EMBEDDING_MODE === "mock") {
    return texts.map((t) => mockEmbed(t));
  }

  try {
    return await embedViaHttp(endpoint, texts, opts?.inputType ?? "document");
  } catch (err) {
    // Local mode: never silently mock — that produced random RAG on the CN book.
    const allowMock =
      opts?.allowMockFallback === true || env.EMBEDDING_MODE === "remote";
    if (!allowMock) {
      throw err instanceof Error
        ? err
        : new Error(`Embedding backend failed: ${String(err)}`);
    }
    console.warn("embedding backend failed, falling back to mock:", err);
    return texts.map((t) => mockEmbed(t));
  }
}

// Small batches keep 6GB GPUs from OOM on long textbook pages.
const EMBED_BATCH = Math.max(
  1,
  Number.parseInt(process.env.EMBED_BATCH ?? "8", 10) || 8,
);

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

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: env.EMBEDDING_MODEL || EMBEDDING.model,
        input: batch,
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

    const vectors = data.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
    out.push(...vectors);
    if (texts.length > EMBED_BATCH) {
      console.log(
        `embed batch ${Math.floor(i / EMBED_BATCH) + 1}/${Math.ceil(texts.length / EMBED_BATCH)} (${out.length}/${texts.length})`,
      );
    }
  }
  return out;
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
