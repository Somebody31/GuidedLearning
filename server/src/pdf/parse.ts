import { extractText } from "unpdf";

export type ParsedPage = { page: number; text: string };

/**
 * Extract text from PDF (or plain text) without any paid API.
 */
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

function splitPlainTextToPages(text: string, charsPerPage = 1800): ParsedPage[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) {
    return [{ page: 1, text: "[Empty document]" }];
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
