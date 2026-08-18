// Fake AI used when live AI is off. Same shapes as the real generators,
// so the rest of the app does not need two different code paths.

import type {
  Chunk,
  Citation,
  Lesson,
  QuizQuestion,
  Unit,
} from "../types";

export function mockDraftGraph(opts: {
  courseTitle: string;
  sourceNames: string[];
  pageSamples: string[];
}): { units: Unit[]; lessons: Record<string, Lesson> } {
  const corpus = opts.pageSamples.join("\n");
  const structured = extractStructuredOutline(corpus);
  if (structured.units.length > 0) {
    return structured;
  }

  const headings = extractHeadings(corpus);
  const titles =
    headings.length >= 4
      ? headings.slice(0, 24)
      : defaultTitlesFromSources(opts.sourceNames, opts.courseTitle);

  const unitCount = Math.min(6, Math.max(2, Math.ceil(titles.length / 4)));
  const units: Unit[] = [];
  const lessons: Record<string, Lesson> = {};

  for (let u = 0; u < unitCount; u++) {
    const unitId = `u-${u + 1}`;
    const slice = titles.slice(
      Math.floor((u * titles.length) / unitCount),
      Math.floor(((u + 1) * titles.length) / unitCount),
    );
    const lessonIds: string[] = [];
    slice.forEach((title, i) => {
      const id = `l-${u + 1}-${i + 1}`;
      lessonIds.push(id);
      lessons[id] = emptyLesson(id, unitId, title, u * 180 + 40, i * 160 + 40);
    });
    if (lessonIds.length === 0) {
      const id = `l-${u + 1}-1`;
      lessonIds.push(id);
      lessons[id] = emptyLesson(id, unitId, `Topic ${u + 1}`, u * 180 + 40, 40);
    }
    units.push({
      id: unitId,
      title: `Unit ${u + 1}`,
      order: u,
      lessonIds,
    });
  }

  units.forEach((unit, i) => {
    const first = unit.lessonIds[0] ? lessons[unit.lessonIds[0]] : undefined;
    if (first) unit.title = clusterUnitTitle(first.title, i);
  });

  return { units, lessons };
}

/**
 * Prefer textbook-style outlines:
 *  - `## 5 THE NETWORK LAYER`
 *  - `## 5.6 THE NETWORK LAYER IN THE INTERNET, 436`
 *  - `## 1.1.1 Business Applications`
 */
function extractStructuredOutline(text: string): {
  units: Unit[];
  lessons: Record<string, Lesson>;
} {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  type Item = { chapter: number; section: string; title: string };
  const items: Item[] = [];
  const noise =
    /intentionally left blank|contents|preface|acknowledg|library of congress|prentice hall|editorial|copyright|isbn|fifth edition|computer\s*networks\s*$|tanenbaum|wetherall|andrew s\.|david j\./i;

  for (const raw of lines) {
    const line = raw.replace(/^#{1,3}\s+/, "").trim();
    if (line.length < 5 || line.length > 100) continue;
    if (noise.test(line)) continue;

    // Chapter heading: "5 THE NETWORK LAYER" or "CHAPTER 5 …"
    let m = line.match(/^(?:chapter\s+)?(\d{1,2})\s+([A-Z][A-Za-z0-9 ,/\-&'()]{3,80})$/i);
    if (m && !m[2]!.includes(".")) {
      const chapter = Number(m[1]);
      if (chapter >= 1 && chapter <= 20) {
        items.push({
          chapter,
          section: String(chapter),
          title: titleCase(m[2]!),
        });
      }
      continue;
    }

    // Section: "3.2 ERROR DETECTION…, 202" or "1.1 Uses of the Topic"
    m = line.match(
      /^(\d{1,2})\.(\d{1,2})(?:\.(\d{1,2}))?\s+(.+?)(?:,\s*\d+)?$/,
    );
    if (m) {
      const chapter = Number(m[1]);
      if (chapter < 1 || chapter > 20) continue;
      // Prefer top two levels for lessons (skip 1.1.1 deep subsections unless sparse)
      if (m[3]) continue;
      let title = m[4]!.replace(/,\s*\d+\s*$/, "").trim();
      title = titleCase(title);
      if (noise.test(title) || title.length < 4) continue;
      items.push({
        chapter,
        section: `${m[1]}.${m[2]}`,
        title: `${m[1]}.${m[2]} ${title}`.slice(0, 80),
      });
    }
  }

  // Dedup by section key, keep first
  const seen = new Set<string>();
  const unique = items.filter((it) => {
    const key = it.section;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length < 4) {
    return { units: [], lessons: {} };
  }

  // Cap lessons for UI sanity (~24); keep spread across chapters
  const byChapter = new Map<number, Item[]>();
  for (const it of unique) {
    const list = byChapter.get(it.chapter) ?? [];
    list.push(it);
    byChapter.set(it.chapter, list);
  }

  const chapters = [...byChapter.keys()].sort((a, b) => a - b).slice(0, 8);
  const units: Unit[] = [];
  const lessons: Record<string, Lesson> = {};
  let unitOrder = 0;

  for (const ch of chapters) {
    const list = byChapter.get(ch) ?? [];
    // Chapter title item (section === "N") or first section
    const chTitle =
      list.find((x) => x.section === String(ch))?.title ??
      `Chapter ${ch}`;
    const sectionLessons = list
      .filter((x) => x.section.includes("."))
      .slice(0, 5);
    const picks =
      sectionLessons.length > 0
        ? sectionLessons
        : list.slice(0, 3);

    const unitId = `u-${ch}`;
    const lessonIds: string[] = [];
    picks.forEach((it, i) => {
      const id = `l-${ch}-${i + 1}`;
      lessonIds.push(id);
      lessons[id] = emptyLesson(
        id,
        unitId,
        it.title,
        unitOrder * 200 + 40,
        i * 140 + 40,
      );
    });
    if (lessonIds.length === 0) continue;
    units.push({
      id: unitId,
      title: chTitle.length > 60 ? `Ch. ${ch}: ${chTitle.slice(0, 40)}…` : chTitle,
      order: unitOrder++,
      lessonIds,
    });
  }

  // Hard cap total lessons
  while (
    units.reduce((n, u) => n + u.lessonIds.length, 0) > 24 &&
    units.length > 1
  ) {
    const last = units[units.length - 1]!;
    if (last.lessonIds.length > 1) {
      const drop = last.lessonIds.pop()!;
      delete lessons[drop];
    } else {
      for (const id of last.lessonIds) delete lessons[id];
      units.pop();
    }
  }

  return { units, lessons };
}

function titleCase(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  // Keep all-caps short headings readable
  if (t === t.toUpperCase() && t.length > 3) {
    return t
      .toLowerCase()
      .replace(/\b([a-z])/g, (c) => c.toUpperCase())
      .replace(/\b(And|Or|Of|The|In|On|For|To|A|An)\b/g, (w) => w.toLowerCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase());
  }
  return t;
}

function emptyLesson(
  id: string,
  unitId: string,
  title: string,
  x: number,
  y: number,
): Lesson {
  return {
    id,
    unitId,
    title: title.slice(0, 80),
    estMinutes: 10 + (title.length % 8),
    status: "locked",
    mastery: 0,
    difficulty: 0,
    packPriority: 0,
    objectives: [],
    sections: [],
    citations: [],
    quiz: [],
    quizReady: false,
    position: { x, y },
    contentVersion: 0,
  };
}

function extractHeadings(text: string): string[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  const noise =
    /intentionally left blank|contents|preface|library of congress|fifth edition/i;
  for (const raw of lines) {
    const line = raw.replace(/^#{1,3}\s+/, "").trim();
    if (line.length < 8 || line.length > 90) continue;
    if (noise.test(line)) continue;
    if (/^(chapter|unit|section|lecture)\b/i.test(line)) {
      out.push(line.replace(/\s+/g, " ").slice(0, 80));
    } else if (/^\d+(\.\d+)+\s+\S/.test(line)) {
      out.push(line.replace(/,\s*\d+\s*$/, "").slice(0, 80));
    } else if (/^[A-Z][A-Za-z0-9 ,/\-]{6,60}$/.test(line) && !line.endsWith(".")) {
      out.push(line.slice(0, 80));
    }
  }
  return [...new Set(out)];
}

function defaultTitlesFromSources(names: string[], courseTitle: string): string[] {
  const base = names.map((n) =>
    cleanTitle(n.replace(/\.(pdf|txt|md)$/i, "").replace(/[-_]/g, " ")),
  );
  if (base.length === 0) {
    return [
      `Introduction to ${courseTitle}`,
      "Core concepts",
      "Worked examples",
      "Practice & review",
    ];
  }
  const expanded: string[] = [];
  for (const b of base) {
    expanded.push(b, `${b} — fundamentals`, `${b} — details`);
  }
  return expanded.slice(0, 12);
}

function cleanTitle(s: string): string {
  return s.replace(/\s+/g, " ").replace(/^[\d.\s\-–—]+/, "").trim();
}

function clusterUnitTitle(firstLesson: string, index: number): string {
  const words = firstLesson.split(/\s+/).slice(0, 3).join(" ");
  return words || `Unit ${index + 1}`;
}

export function mockGenerateLesson(opts: {
  title: string;
  retrieved: { chunk: Chunk; score: number }[];
}): {
  objectives: string[];
  sections: { heading: string; body: string }[];
  citations: Citation[];
} {
  const top = opts.retrieved.slice(0, 3);
  const citations: Citation[] = top.map((r, i) => ({
    id: `c-${i + 1}`,
    sourceId: r.chunk.sourceId,
    sourceName: r.chunk.sourceName,
    page: r.chunk.pageStart,
    excerpt: r.chunk.text.slice(0, 160),
    chunkId: r.chunk.id,
  }));

  const bodies = top.map((r) => r.chunk.text.slice(0, 500));
  const sections =
    bodies.length > 0
      ? bodies.map((body, i) => ({
          heading: i === 0 ? "From your sources" : `Source note ${i + 1}`,
          body:
            body ||
            `${opts.title} — limited source text available offline.`,
        }))
      : [
          {
            heading: "Overview",
            body: `${opts.title}: no retrieved chunks yet. Re-run build after sources parse, or upload text-rich PDFs.`,
          },
        ];

  return {
    objectives: [
      `Define the main idea of ${opts.title}`,
      `Relate ${opts.title} to neighboring topics on the path`,
      "Recall one exam-style pitfall",
    ],
    sections,
    citations,
  };
}

export function mockGenerateQuiz(opts: {
  title: string;
  sections: { heading: string; body: string }[];
}): QuizQuestion[] {
  const snippet =
    opts.sections[0]?.body.slice(0, 80).replace(/\s+/g, " ") || opts.title;
  return [
    {
      id: "q1",
      stem: `What is the primary focus of “${opts.title}”?`,
      options: [
        { id: "a", text: "An unrelated historical anecdote" },
        { id: "b", text: `Core ideas around: ${snippet.slice(0, 48)}…` },
        { id: "c", text: "Something this lesson does not cover" },
        { id: "d", text: "A tool or product unrelated to the topic" },
      ],
      correctOptionId: "b",
      explanation: `Grounded (mock) on lesson content for ${opts.title}.`,
    },
    {
      id: "q2",
      stem: `Which study habit best supports mastery of ${opts.title}?`,
      options: [
        { id: "a", text: "Skip the quiz entirely" },
        { id: "b", text: "Read without checking sources" },
        { id: "c", text: "Quiz, then review weak points on the path" },
        { id: "d", text: "Memorize random page numbers" },
      ],
      correctOptionId: "c",
      explanation: "Quiz is the completion gate; path priorities update after.",
    },
    {
      id: "q3",
      stem: `A common pitfall for ${opts.title} is…`,
      options: [
        { id: "a", text: "Confusing adjacent concepts" },
        { id: "b", text: "Treating every detail as equally important" },
        { id: "c", text: "Ignoring units in numerical answers" },
        { id: "d", text: "All of the above can appear on exams" },
      ],
      correctOptionId: "d",
      explanation: "Mock multi-pitfall item for difficulty signal.",
    },
  ];
}

export function mockDiagnosticItems(
  lessonTitles: string[],
): { lessonId: string; stem: string; options: { id: string; text: string }[]; correctOptionId: string }[] {
  return lessonTitles.slice(0, 6).map((title, i) => ({
    lessonId: `diag-${i}`,
    stem: `How comfortable are you with: ${title.replace(/[?？]+$/, "").trim()}?`,
    options: [
      { id: "a", text: "Strong — I’ve practiced this" },
      { id: "b", text: "Okay — I need a light review" },
      { id: "c", text: "Weak — start from basics" },
      { id: "d", text: "Skip — not sure" },
    ],
    correctOptionId: "a",
  }));
}

export function mockFaithfulness(
  claim: string,
  chunkText: string,
): boolean {
  const words = claim
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4);
  if (words.length === 0) return true;
  const hay = chunkText.toLowerCase();
  const hits = words.filter((w) => hay.includes(w)).length;
  return hits / words.length >= 0.25;
}
