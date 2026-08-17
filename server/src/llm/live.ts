// Ask DeepSeek for a short lesson or quiz. Used only when a student opens a lesson.

import type { Chunk, Citation, QuizQuestion } from "../types";
import { chatCompletion } from "./client";
import { env } from "../env";

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) {
    return t;
  }
  return `${t.slice(0, n - 1)}…`;
}

export async function liveGenerateLesson(opts: {
  title: string;
  retrieved: { chunk: Chunk; score: number }[];
}): Promise<{
  objectives: string[];
  sections: { heading: string; body: string }[];
  citations: Citation[];
}> {
  const top = opts.retrieved.slice(0, 3);
  const sources = top
    .map(
      (r, i) =>
        `[${i + 1}] ${r.chunk.sourceName} p.${r.chunk.pageStart} (score=${r.score.toFixed(2)}): ${clip(r.chunk.text, 420)}`,
    )
    .join("\n");

  const raw = await chatCompletion({
    temperature: 0.2,
    json: true,
    maxTokens: Math.min(450, env.LIVE_AI_MAX_OUTPUT_TOKENS),
    messages: [
      {
        role: "system",
        content:
          "You write brief study notes grounded ONLY in provided excerpts for the named lesson section. Ignore off-topic excerpts. Reply JSON: {objectives:string[2], sections:[{heading,body}] length 1-2, bodies ≤90 words each}. No fluff.",
      },
      {
        role: "user",
        content: `Lesson section: ${opts.title}\nStay on this section's topic (e.g. if title is 1.2 Network Hardware, do not write about crypto or email).\n\nExcerpts:\n${sources || "(no excerpts — write a 60-word placeholder overview)"}\n\nJSON only.`,
      },
    ],
  });

  const parsed = JSON.parse(raw) as {
    objectives?: string[];
    sections?: { heading?: string; body?: string }[];
  };

  const citations: Citation[] = top.map((r, i) => ({
    id: `c-${i + 1}`,
    sourceId: r.chunk.sourceId,
    sourceName: r.chunk.sourceName,
    page: r.chunk.pageStart,
    excerpt: clip(r.chunk.text, 120),
    chunkId: r.chunk.id,
  }));

  const sections = (parsed.sections ?? [])
    .filter((s) => s.heading && s.body)
    .slice(0, 2)
    .map((s) => ({
      heading: clip(String(s.heading), 80),
      body: clip(String(s.body), 700),
    }));

  return {
    objectives: (parsed.objectives ?? [])
      .map((o) => clip(String(o), 120))
      .slice(0, 2)
      .concat(
        sections.length
          ? []
          : [`Recall the main idea of ${opts.title}`, "Note one exam pitfall"],
      )
      .slice(0, 2),
    sections:
      sections.length > 0
        ? sections
        : [
            {
              heading: "Overview",
              body: clip(
                `${opts.title}: limited grounded text; review sources and retry generation.`,
                200,
              ),
            },
          ],
    citations,
  };
}

export async function liveGenerateQuiz(opts: {
  title: string;
  sections: { heading: string; body: string }[];
}): Promise<QuizQuestion[]> {
  const body = clip(
    opts.sections.map((s) => s.body).join(" "),
    500,
  );

  const raw = await chatCompletion({
    temperature: 0.2,
    json: true,
    maxTokens: Math.min(350, env.LIVE_AI_MAX_OUTPUT_TOKENS),
    messages: [
      {
        role: "system",
        content:
          'Reply JSON only: {questions:[{id,stem,options:[{id,text}],correctOptionId,explanation}]}. Exactly 2 MCQs, 4 options a-d each. Short stems. Explanations ≤20 words.',
      },
      {
        role: "user",
        content: `Lesson “${opts.title}”\nNotes: ${body}\nMake 2 quiz items grounded in the notes.`,
      },
    ],
  });

  const parsed = JSON.parse(raw) as {
    questions?: {
      id?: string;
      stem?: string;
      options?: { id?: string; text?: string }[];
      correctOptionId?: string;
      explanation?: string;
    }[];
  };

  const qs = (parsed.questions ?? []).slice(0, 2).map((q, i) => {
    const options = (q.options ?? [])
      .filter((o) => o.id != null && o.text != null)
      .slice(0, 4)
      .map((o) => ({
        id: String(o.id).trim() || String.fromCharCode(97),
        text: clip(String(o.text), 100),
      }));
    while (options.length < 4) {
      const id = String.fromCharCode(97 + options.length);
      options.push({ id, text: `Option ${id}` });
    }
    const want = q.correctOptionId != null ? String(q.correctOptionId) : "";
    const correct =
      options.find((o) => o.id === want)?.id ?? options[0]!.id;
    return {
      id: (q.id != null && String(q.id).trim()) || `q${i + 1}`,
      stem: clip(String(q.stem ?? `Question about ${opts.title}`), 200),
      options,
      correctOptionId: correct,
      explanation: clip(String(q.explanation ?? "Based on lesson notes."), 120),
    } satisfies QuizQuestion;
  });

  if (qs.length < 2) {
    throw new Error("Live quiz returned fewer than 2 questions");
  }
  return qs;
}
