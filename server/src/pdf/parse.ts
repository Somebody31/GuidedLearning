// Pull text out of a PDF or a .txt/.md file. No paid API.

import { extractText } from "unpdf";

export type ParsedPage = { page: number; text: string };
export async function parseDocument(
  bytes: Uint8Array,
  filename: string,
): Promise<ParsedPage[]> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = new TextDecoder().decode(bytes);
    return splitPlainTextToPages(text);
  }

  try {
    const result = await extractText(bytes, { mergePages: false });
    const texts = Array.isArray(result.text) ? result.text : [String(result.text ?? "")];
    const pages: ParsedPage[] = texts
      .map((t, i) => ({
        page: i + 1,
        text: (t ?? "").replace(/\s+/g, " ").trim(),
      }))
      .filter((p) => p.text.length > 0);

    if (pages.length === 0) {
      // Image-only or empty — honest synthetic stub so pipeline continues
      return [
        {
          page: 1,
          text: `[No extractable text in ${filename}. OCR not available in offline mode.]`,
        },
      ];
    }
    return pages;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Fallback: treat as text if it looks like UTF-8
    try {
      const asText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (asText.replace(/\0/g, "").trim().length > 40) {
        return splitPlainTextToPages(asText);
      }
    } catch {
      /* ignore */
    }
    throw new Error(`PDF parse failed for ${filename}: ${msg}`);
  }
}

/**
 * Prefer markdown/section-aware chunks so RAG hits "§1.2 …" as whole units.
 * Falls back to fixed windows when the file has no structural headings.
 */
function splitPlainTextToPages(text: string, charsPerPage = 1800): ParsedPage[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) {
    return [{ page: 1, text: "[Empty document]" }];
  }

  // Split before ## headings or "1.2 TITLE" / "CHAPTER n" lines
  // (escape / inside the regex literal so it does not terminate the pattern)
  const parts = clean.split(
    /(?=^#{1,3}\s+\S|^(?:CHAPTER|Chapter)\s+\d+\b|^\d{1,2}(?:\.\d{1,2}){1,2}\s+[A-Z][A-Za-z0-9 ,\-()'&]{3,})/m,
  );

  const structural = parts.filter((p) => p.trim().length > 0);
  const headingish = structural.filter((p) =>
    /^#{1,3}\s+\S|^(?:CHAPTER|Chapter)\s+\d|\d{1,2}(?:\.\d{1,2}){1,2}\s+[A-Z]/.test(
      p.trim(),
    ),
  ).length;

  if (headingish >= 8) {
    const pages: ParsedPage[] = [];
    for (const part of structural) {
      const t = part.trim();
      if (!t) continue;
      // Oversized sections: hard-wrap while keeping the heading on the first piece
      if (t.length <= charsPerPage * 1.4) {
        pages.push({ page: pages.length + 1, text: t });
      } else {
        for (let i = 0; i < t.length; i += charsPerPage) {
          pages.push({
            page: pages.length + 1,
            text: t.slice(i, i + charsPerPage).trim(),
          });
        }
      }
    }
    if (pages.length > 0) return pages;
  }

  const pages: ParsedPage[] = [];
  for (let i = 0; i < clean.length; i += charsPerPage) {
    pages.push({
      page: pages.length + 1,
      text: clean.slice(i, i + charsPerPage).trim(),
    });
  }
  return pages;
}
