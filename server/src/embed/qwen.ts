// Turn text into a list of numbers (an embedding).
// mock = fake hash vectors (free). local/remote = the real model.

import { embeddingEndpoint, env, liveEmbedEnabled } from "../env";
import { EMBEDDING } from "../llm/models";

export function mockEmbed(text: string, dims = env.EMBEDDING_DIMS): number[] {
  const v = new Array<number>(dims).fill(0);
  const s = text.toLowerCase();

  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    v[i % dims]! += ((code * (i + 1)) % 97) / 97;
  }

  const tokens = s.split(/[^a-z0-9]+/).filter(Boolean);
  for (const tok of tokens) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) {
      h = (h * 31 + tok.charCodeAt(i)) >>> 0;
    }
    v[h % dims]! += 1;
  }

  let sumSquares = 0;
  for (const x of v) {
    sumSquares += x * x;
  }
  const norm = Math.sqrt(sumSquares) || 1;
  return v.map((x) => x / norm);
}

export type EmbedInputType = "document" | "query";

export async function embedTexts(
  texts: string[],
  opts?: { inputType?: EmbedInputType; allowMockFallback?: boolean },
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const endpoint = embeddingEndpoint();
  if (!endpoint || env.EMBEDDING_MODE === "mock") {
    return texts.map((t) => mockEmbed(t));
  }

  try {
    return await embedViaHttp(endpoint, texts, opts?.inputType ?? "document");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const sidecarDown =
      env.EMBEDDING_MODE === "local" &&
      /connect|ECONNREFUSED|Unable to connect/i.test(msg);
    // Remote (and a down local sidecar) can keep parsing with mock vectors.
    const allowMock =
      opts?.allowMockFallback === true ||
      env.EMBEDDING_MODE === "remote" ||
      sidecarDown;
    if (!allowMock) {
      if (err instanceof Error) throw err;
      throw new Error(`Embedding backend failed: ${String(err)}`);
    }
    console.warn("embedding backend failed, falling back to mock:", err);
    return texts.map((t) => mockEmbed(t));
  }
}

const EMBED_BATCH = Math.max(
  1,
  Number.parseInt(process.env.EMBED_BATCH ?? "8", 10) || 8,
);

async function embedViaHttp(
  base: string,
  texts: string[],
  inputType: EmbedInputType,
): Promise<number[][]> {
  const url = base.endsWith("/embeddings") ? base : `${base}/v1/embeddings`;

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
    if (!data.data || data.data.length === 0) {
      throw new Error("Embedding response empty");
    }

    const rows = data.data.slice();
    rows.sort((a, b) => a.index - b.index);
    for (const row of rows) {
      out.push(row.embedding);
    }

    if (texts.length > EMBED_BATCH) {
      const done = Math.min(i + batch.length, texts.length);
      console.log(`embed batch ${done}/${texts.length}`);
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
  if (liveEmbedEnabled() && env.EMBEDDING_BASE_URL) return "remote";
  return "mock";
}
