import type {
  Chunk,
  Citation,
  Lesson,
  QuizQuestion,
  Unit,
} from "../types";

/** Offline stand-ins for DeepSeek — free, deterministic, good enough for pipeline demos. */

export function mockDraftGraph(opts: {
  courseTitle: string;
  sourceNames: string[];
  pageSamples: string[];
}): { units: Unit[]; lessons: Record<string, Lesson> } {
  const corpus = opts.pageSamples.join("\n");
  const headings = extractHeadings(corpus);
  const titles =
    headings.length >= 4
      ? headings.slice(0, 12)
      : defaultTitlesFromSources(opts.sourceNames, opts.courseTitle);

  const unitCount = Math.min(4, Math.max(2, Math.ceil(titles.length / 3)));
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
      lessons[id] = emptyLesson(id, unitId, title, u * 180 + 40, i * 220 + 40);
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

  // Name units from first lesson when possible
  units.forEach((unit, i) => {
    const first = unit.lessonIds[0] ? lessons[unit.lessonIds[0]] : undefined;
    if (first) unit.title = clusterUnitTitle(first.title, i);
  });

  return { units, lessons };
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
  for (const line of lines) {
    if (line.length < 8 || line.length > 80) continue;
    if (/^(chapter|unit|section|lecture|\d+[\.\):])\b/i.test(line)) {
      out.push(cleanTitle(line));
    } else if (/^[A-Z][A-Za-z0-9 ,/\-]{6,60}$/.test(line) && !line.endsWith(".")) {
      out.push(cleanTitle(line));
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
        { id: "c", text: "Only physical-layer signaling" },
        { id: "d", text: "Only application UI design" },
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
        { id: "b", text: "Using only one layer’s vocabulary for everything" },
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
    stem: `How comfortable are you with: ${title}?`,
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
