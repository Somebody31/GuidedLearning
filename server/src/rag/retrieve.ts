// Find the chunks that best match a lesson title.
// We mix three simple scores: section number, word overlap, and vector similarity.

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
  if (d === 0) return 0;
  return dot / d;
}

// Pull numbers like 1.2 or 5.6.1 out of a title.
export function extractSectionIds(query: string): string[] {
  const found = new Set<string>();
  const re = /\b(\d{1,2}(?:\.\d{1,2}){1,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query))) {
    found.add(m[1]!);
  }
  return [...found];
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "are",
  "was",
  "were",
  "have",
  "has",
  "been",
  "into",
  "about",
  "lesson",
  "chapter",
  "section",
  "network",
  "computer",
]);

function tokenize(s: string): string[] {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9.\s-]+/g, " ");
  const parts = cleaned.split(/\s+/);
  const out: string[] = [];
  for (const t of parts) {
    if (t.length > 2 && !STOP.has(t)) {
      out.push(t);
    }
  }
  return out;
}

function looksLikeTableOfContents(text: string): boolean {
  const pipes = (text.match(/\|/g) ?? []).length;
  if (pipes >= 4) return true;
  if (/\bcontents\b/i.test(text.slice(0, 200))) return true;
  if (/intentionally left blank/i.test(text)) return true;
  return false;
}

export async function retrieveChunks(
  query: string,
  chunks: Chunk[],
  k = 4,
): Promise<{ chunk: Chunk; score: number }[]> {
  if (chunks.length === 0) return [];

  const sectionIds = extractSectionIds(query);
  const qTokens = tokenize(query);
  const lexicalTokens = qTokens.filter((t) => !/^\d+(\.\d+)*$/.test(t));

  let qVec: number[] | null = null;
  try {
    const vectors = await embedTexts([query], { inputType: "query" });
    qVec = vectors[0] ?? null;
  } catch (err) {
    console.warn("query embed failed, lexical/section only:", err);
  }

  const scored: { chunk: Chunk; score: number }[] = [];

  for (const chunk of chunks) {
    const text = chunk.text;
    const lower = text.toLowerCase();
    let score = 0;
    const tocLike = looksLikeTableOfContents(text);
    if (tocLike) {
      score -= 4;
    }

    // 1) Section heading match
    for (const sid of sectionIds) {
      const escaped = sid.replace(/\./g, "\\.");
      const mdHeading = new RegExp(`^#{1,3}\\s*${escaped}\\b`, "m");
      const bodyHeading = new RegExp(
        `(?:^|\\n)\\s*${escaped}\\s+[A-Z][A-Za-z][^|\\n]{2,60}\\s*$`,
        "m",
      );
      if (mdHeading.test(text)) {
        score += 8;
        if (mdHeading.test(text.slice(0, 500))) score += 3;
      } else if (bodyHeading.test(text) && !tocLike) {
        score += 6;
      } else if (
        !tocLike &&
        new RegExp(`(?:^|[\\n\\s#])${escaped}\\s+[A-Za-z]`, "m").test(text)
      ) {
        score += 2;
      }
    }

    // 2) Shared words
    if (lexicalTokens.length > 0) {
      const cTokens = new Set(tokenize(text));
      let hits = 0;
      for (const t of lexicalTokens) {
        if (cTokens.has(t)) hits += 1;
      }
      score += (hits / lexicalTokens.length) * 2;
      if (lexicalTokens.length >= 2) {
        const phrase = lexicalTokens.slice(0, 4).join(" ");
        if (lower.includes(phrase)) score += 1.5;
      }
    }

    // 3) Vector similarity
    if (qVec && chunk.embedding.length > 0) {
      score += cosine(qVec, chunk.embedding) * 2.5;
    }

    scored.push({ chunk, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const best: { chunk: Chunk; score: number }[] = [];
  for (const row of scored) {
    if (row.score > -1) best.push(row);
    if (best.length >= k) break;
  }
  return best;
}
