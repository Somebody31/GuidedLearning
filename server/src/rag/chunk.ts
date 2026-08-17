// Split pages into smaller pieces, then turn each piece into a vector.

import type { Chunk, SourcePage } from "../types";
import { embedTexts } from "../embed/qwen";

const TARGET_CHARS = 1400;
const OVERLAP = 200;

export async function chunkAndEmbedPages(opts: {
  courseId: string;
  sourceId: string;
  sourceName: string;
  pages: SourcePage[];
}): Promise<Chunk[]> {
  const pieces: { pageStart: number; pageEnd: number; text: string }[] = [];

  let buf = "";
  let pageStart = opts.pages[0]?.page ?? 1;
  let pageEnd = pageStart;

  for (const p of opts.pages) {
    const next = (buf ? `${buf}\n\n` : "") + p.text;
    if (buf && next.length > TARGET_CHARS) {
      pieces.push({ pageStart, pageEnd, text: buf.trim() });
      const overlapText = buf.slice(-OVERLAP);
      buf = `${overlapText}\n\n${p.text}`.trim();
      pageStart = p.page;
      pageEnd = p.page;
    } else {
      buf = next;
      pageEnd = p.page;
      if (!pieces.length) pageStart = p.page;
    }
  }
  if (buf.trim()) {
    pieces.push({ pageStart, pageEnd, text: buf.trim() });
  }

  const embeddings = await embedTexts(pieces.map((p) => p.text));

  return pieces.map((p, i) => ({
    id: `chk-${opts.sourceId}-${i}`,
    courseId: opts.courseId,
    sourceId: opts.sourceId,
    sourceName: opts.sourceName,
    pageStart: p.pageStart,
    pageEnd: p.pageEnd,
    text: p.text,
    embedding: embeddings[i] ?? [],
  }));
}
