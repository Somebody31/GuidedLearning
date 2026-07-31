import type { Chunk } from "../types";
import { embedTexts } from "../embed/qwen";

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export async function retrieveChunks(
  query: string,
  chunks: Chunk[],
  k = 4,
): Promise<{ chunk: Chunk; score: number }[]> {
  if (chunks.length === 0) return [];
  const [q] = await embedTexts([query], { inputType: "query" });
  if (!q) return [];
  return chunks
    .filter((chunk) => chunk.embedding.length > 0)
    .map((chunk) => ({ chunk, score: cosine(q, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
