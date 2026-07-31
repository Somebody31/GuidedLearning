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

/** Pull textbook section ids like 1.2, 5.6.1 from a lesson title. */
export function extractSectionIds(query: string): string[] {
  const found = new Set<string>();
  const re = /\b(\d{1,2}(?:\.\d{1,2}){1,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query))) {
    found.add(m[1]!);
  }
  return [...found];
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
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
  "network", // too common in a CN textbook alone
  "computer",
]);

/**
 * Hybrid retrieval for textbooks:
 *  1. Section-id hit (e.g. lesson "1.2 Network Hardware" → chunks with "## 1.2 …")
 *  2. Lexical token overlap on the remaining title words
 *  3. Dense cosine (only useful when chunks have real embeddings)
 */
export async function retrieveChunks(
  query: string,
  chunks: Chunk[],
  k = 4,
): Promise<{ chunk: Chunk; score: number }[]> {
  if (chunks.length === 0) return [];

  const sectionIds = extractSectionIds(query);
  const qTokens = tokenize(query);
  // Prefer non-numeric title words for lexical match
  const lexicalTokens = qTokens.filter((t) => !/^\d+(\.\d+)*$/.test(t));

  let qVec: number[] | null = null;
  try {
    const [q] = await embedTexts([query], { inputType: "query" });
    qVec = q ?? null;
  } catch (err) {
    console.warn("query embed failed, lexical/section only:", err);
  }

  const scored = chunks.map((chunk) => {
    const text = chunk.text;
    const lower = text.toLowerCase();
    let score = 0;

    // TOC / front-matter noise (book contents tables list every section id)
    const tocLike =
      (text.match(/\|/g)?.length ?? 0) >= 4 ||
      /\bcontents\b/i.test(text.slice(0, 200)) ||
      /intentionally left blank/i.test(text);
    if (tocLike) score -= 4;

    // (1) Section heading match — strongest signal for Tanenbaum-style lessons
    for (const sid of sectionIds) {
      const escaped = sid.replace(/\./g, "\\.");
      // Prefer real markdown/body headings, not "| 1.2 TITLE, 17 |" TOC rows
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

    // (2) Lexical overlap
    if (lexicalTokens.length > 0) {
      const cTokens = new Set(tokenize(text));
      let hits = 0;
      for (const t of lexicalTokens) {
        if (cTokens.has(t)) hits += 1;
      }
      score += (hits / lexicalTokens.length) * 2;
      // Phrase boost for multi-word titles like "network hardware"
      if (lexicalTokens.length >= 2) {
        const phrase = lexicalTokens.slice(0, 4).join(" ");
        if (lower.includes(phrase)) score += 1.5;
      }
    }

    // (3) Dense cosine
    if (qVec && chunk.embedding.length > 0) {
      const c = cosine(qVec, chunk.embedding);
      // Scale cosine (typically 0.2–0.8) into a similar band
      score += c * 2.5;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > -1).slice(0, k);
}
