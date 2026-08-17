// Background jobs: parse a PDF, build a course map, write a lesson, write a quiz.
// The API starts a job and this file actually does the work.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { env, liveLlmEnabled } from "../env";
import { store } from "../db/store";
import { parseDocument } from "../pdf/parse";
import { chunkAndEmbedPages } from "../rag/chunk";
import { retrieveChunks } from "../rag/retrieve";
import {
  mockDraftGraph,
  mockFaithfulness,
  mockGenerateLesson,
  mockGenerateQuiz,
} from "../llm/mock";
import { liveGenerateLesson, liveGenerateQuiz } from "../llm/live";
import { canSpendLiveCall, liveBudgetSnapshot } from "../llm/budget";
import type { Job, SourcePage } from "../types";

const processing = new Set<string>();

// Start any jobs that are waiting. Safe to call often.
export function kickJobs() {
  void drainQueue();
}

async function drainQueue() {
  const queued = [...store.jobs.values()].filter((j) => j.status === "queued");
  for (const job of queued) {
    if (processing.has(job.id)) continue;
    processing.add(job.id);
    try {
      await runJob(job.id);
    } catch (err) {
      console.error("job failed", job.id, err);
      const message = err instanceof Error ? err.message : String(err);
      store.updateJob(job.id, {
        status: "failed",
        error: message,
        progress: 1,
      });
      if (job.sourceId) {
        const course = store.getCourseMutable(job.courseId);
        const source = course?.sources.find((s) => s.id === job.sourceId);
        if (source) {
          source.status = "failed";
          source.error = message;
        }
      }
    } finally {
      processing.delete(job.id);
    }
  }
}

async function runJob(jobId: string) {
  const job = store.jobs.get(jobId);
  if (!job || job.status !== "queued") return;

  store.updateJob(jobId, { status: "running", progress: 0.05 });

  switch (job.type) {
    case "parse_source":
      await runParseSource(job);
      break;
    case "draft_graph":
      await runDraftGraph(job);
      break;
    case "generate_lesson":
      await runGenerateLesson(job);
      break;
    case "generate_quiz":
      await runGenerateQuiz(job);
      break;
    case "generate_course_content":
      await runGenerateCourseContent(job);
      break;
    case "reembed":
      await runReembed(job);
      break;
    default:
      store.updateJob(jobId, {
        status: "failed",
        error: `Unknown job type`,
        progress: 1,
      });
  }
}

async function runParseSource(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course || !job.sourceId) throw new Error("missing course/source");
  const source = course.sources.find((s) => s.id === job.sourceId);
  if (!source?.storageKey) throw new Error("source missing storageKey");

  source.status = "parsing";
  store.updateJob(job.id, { progress: 0.2 });

  const path = join(env.DATA_DIR, source.storageKey);
  const bytes = new Uint8Array(await readFile(path));
  const pages = await parseDocument(bytes, source.name);
  store.updateJob(job.id, { progress: 0.5 });

  const sourcePages: SourcePage[] = pages.map((p) => ({
    sourceId: source.id,
    page: p.page,
    text: p.text,
  }));
  store.setPages(source.id, sourcePages);

  const chunks = await chunkAndEmbedPages({
    courseId: course.id,
    sourceId: source.id,
    sourceName: source.name,
    pages: sourcePages,
  });
  store.appendChunks(course.id, chunks);

  source.pages = pages.length;
  source.status = "ready";
  source.error = undefined;
  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: { pages: pages.length, chunks: chunks.length },
  });
}

async function runDraftGraph(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course) throw new Error("course missing");
  if (course.lifecycle === "activated") {
    throw new Error("Cannot rebuild graph after activate (IDs frozen)");
  }

  store.updateJob(job.id, { progress: 0.2 });
  const ready = course.sources.filter((s) => s.status === "ready");
  // Scan all pages for structural headings (cheap). Front-matter-only
  // samples used to produce useless graphs on large textbooks.
  const samples: string[] = [];
  for (const s of ready) {
    const pages = store.getPages(s.id);
    const headingLines: string[] = [];
    for (const p of pages) {
      for (const line of p.text.split("\n")) {
        const t = line.trim();
        if (!t || t.length > 120) continue;
        if (
          /^#{1,3}\s+/.test(t) ||
          /^(chapter|part|unit)\b/i.test(t) ||
          /^\d+(\.\d+){0,2}\s+[A-Z]/.test(t) ||
          /^\d+\s+[A-Z][A-Z\s]{3,}/.test(t)
        ) {
          headingLines.push(t);
        }
      }
    }
    // Prefer extracted headings; fall back to scattered page samples
    if (headingLines.length >= 6) {
      samples.push(headingLines.join("\n"));
    } else {
      const step = Math.max(1, Math.floor(pages.length / 40));
      for (let i = 0; i < pages.length; i += step) {
        samples.push(pages[i]!.text.slice(0, 600));
      }
    }
  }

  // Always mock graph offline (live path reserved for later opt-in)
  const draft = mockDraftGraph({
    courseTitle: course.title,
    sourceNames: ready.map((s) => s.name),
    pageSamples: samples,
  });

  store.updateJob(job.id, { progress: 0.7 });
  course.units = draft.units;
  course.lessons = draft.lessons;
  course.lifecycle = "draft_saved";
  course.graphVersion += 1;

  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: {
      units: course.units.length,
      lessons: Object.keys(course.lessons).length,
      mode: "mock",
    },
  });
  // Content generation waits for activate (confirm → activate → generate).
}

async function runGenerateLesson(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course || !job.lessonId) throw new Error("missing lesson");
  const lesson = course.lessons[job.lessonId];
  if (!lesson) throw new Error("lesson not found");

  // Skip rewrite if content already present (avoids races wiping quiz state).
  if (lesson.sections.length > 0 && lesson.quizReady && lesson.quiz.length > 0) {
    store.updateJob(job.id, {
      status: "succeeded",
      progress: 1,
      result: { skipped: true, reason: "already_generated" },
    });
    return;
  }

  // Prefer regenerating only missing half if partial.
  if (lesson.sections.length > 0 && !lesson.quizReady) {
    store.updateJob(job.id, {
      status: "succeeded",
      progress: 1,
      result: { skipped: true, reason: "sections_ready_queue_quiz" },
    });
    store.enqueueJob({
      type: "generate_quiz",
      courseId: course.id,
      lessonId: lesson.id,
    });
    kickJobs();
    return;
  }

  const chunks = store.getChunks(course.id);
  // Title alone is best for section-id match; objectives may be empty/stale.
  const retrieved = await retrieveChunks(lesson.title, chunks, 4);

  let mode: "mock" | "live" = "mock";
  let gen;
  if (liveLlmEnabled() && canSpendLiveCall()) {
    try {
      gen = await liveGenerateLesson({ title: lesson.title, retrieved });
      mode = "live";
    } catch (err) {
      console.warn("live lesson failed, using mock:", err);
      gen = mockGenerateLesson({ title: lesson.title, retrieved });
    }
  } else {
    gen = mockGenerateLesson({ title: lesson.title, retrieved });
  }

  lesson.objectives = gen.objectives;
  lesson.sections = gen.sections;
  lesson.citations = gen.citations;
  lesson.contentVersion += 1;
  lesson.quizReady = false;

  // faithfulness samples (local, free)
  for (const c of gen.citations.slice(0, 1)) {
    const body = gen.sections[0]?.body ?? "";
    const chunk = retrieved.find((r) => r.chunk.id === c.chunkId)?.chunk;
    store.addEval({
      id: `ev-${crypto.randomUUID().slice(0, 8)}`,
      courseId: course.id,
      claim: body.slice(0, 120),
      chunkId: c.chunkId,
      faithful: chunk
        ? mockFaithfulness(body.slice(0, 120), chunk.text)
        : null,
      createdAt: new Date().toISOString(),
    });
  }

  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: {
      citations: gen.citations.length,
      mode,
      budget: liveBudgetSnapshot(),
    },
  });

  store.enqueueJob({
    type: "generate_quiz",
    courseId: course.id,
    lessonId: lesson.id,
  });
  kickJobs();
}

async function runGenerateQuiz(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course || !job.lessonId) throw new Error("missing lesson");
  const lesson = course.lessons[job.lessonId];
  if (!lesson) throw new Error("lesson not found");

  if (lesson.quizReady && lesson.quiz.length > 0) {
    store.updateJob(job.id, {
      status: "succeeded",
      progress: 1,
      result: { skipped: true, reason: "quiz_ready" },
    });
    return;
  }

  let mode: "mock" | "live" = "mock";
  if (liveLlmEnabled() && canSpendLiveCall()) {
    try {
      lesson.quiz = await liveGenerateQuiz({
        title: lesson.title,
        sections: lesson.sections,
      });
      mode = "live";
    } catch (err) {
      console.warn("live quiz failed, using mock:", err);
      lesson.quiz = mockGenerateQuiz({
        title: lesson.title,
        sections: lesson.sections,
      });
    }
  } else {
    lesson.quiz = mockGenerateQuiz({
      title: lesson.title,
      sections: lesson.sections,
    });
  }
  lesson.quizReady = true;

  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: {
      questions: lesson.quiz.length,
      mode,
      budget: liveBudgetSnapshot(),
    },
  });
}

async function runReembed(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course) throw new Error("course missing");
  const chunks = store.getChunks(course.id);
  if (chunks.length === 0) {
    store.updateJob(job.id, {
      status: "succeeded",
      progress: 1,
      result: { note: "no chunks", count: 0 },
    });
    return;
  }

  // Re-embed in place so retrieval stops using mock vectors from CUDA-OOM fallback.
  const { embedTexts } = await import("../embed/qwen");
  const BATCH = 32;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const vectors = await embedTexts(
      slice.map((c) => c.text),
      { inputType: "document" },
    );
    for (let j = 0; j < slice.length; j++) {
      slice[j]!.embedding = vectors[j] ?? [];
    }
    store.updateJob(job.id, {
      progress: Math.min(0.95, (i + slice.length) / chunks.length),
    });
    console.log(
      `reembed ${Math.min(i + slice.length, chunks.length)}/${chunks.length}`,
    );
  }
  store.setChunks(course.id, chunks);
  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: {
      count: chunks.length,
      dims: chunks[0]?.embedding.length ?? 0,
      mode: "local",
    },
  });
}

async function runGenerateCourseContent(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course) throw new Error("missing course");

  // Live path: never fan-out N lesson API calls on activate.
  if (liveLlmEnabled() && env.LIVE_AI_LAZY_ONLY) {
    store.updateJob(job.id, {
      status: "succeeded",
      progress: 1,
      result: {
        enqueued: 0,
        lazy: true,
        note: "Live AI lazy mode — content generates when a lesson is opened (saves tokens).",
        budget: liveBudgetSnapshot(),
      },
    });
    return;
  }

  let enqueued = 0;
  for (const lid of Object.keys(course.lessons)) {
    const lesson = course.lessons[lid];
    if (lesson?.sections.length && lesson.quizReady) continue;
    store.enqueueJob({
      type: "generate_lesson",
      courseId: course.id,
      lessonId: lid,
    });
    enqueued += 1;
  }
  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: { enqueued, lazy: false },
  });
  kickJobs();
}
