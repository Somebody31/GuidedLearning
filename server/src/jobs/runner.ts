import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { env } from "../env";
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
import type { Job, SourcePage } from "../types";

const processing = new Set<string>();

/** Fire-and-forget job processing (same process as API). */
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
      store.updateJob(job.id, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        progress: 1,
      });
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
      store.updateJob(jobId, {
        status: "succeeded",
        progress: 1,
        result: { note: "reembed not needed offline" },
      });
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
  const samples: string[] = [];
  for (const s of ready) {
    const pages = store.getPages(s.id);
    samples.push(...pages.slice(0, 3).map((p) => p.text.slice(0, 800)));
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

  const chunks = store.getChunks(course.id);
  const retrieved = await retrieveChunks(
    `${lesson.title} ${lesson.objectives.join(" ")}`,
    chunks,
    4,
  );
  const gen = mockGenerateLesson({ title: lesson.title, retrieved });
  lesson.objectives = gen.objectives;
  lesson.sections = gen.sections;
  lesson.citations = gen.citations;
  lesson.contentVersion += 1;
  lesson.quizReady = false;

  // faithfulness samples
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
    result: { citations: gen.citations.length, mode: "mock" },
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

  lesson.quiz = mockGenerateQuiz({
    title: lesson.title,
    sections: lesson.sections,
  });
  lesson.quizReady = true;

  store.updateJob(job.id, {
    status: "succeeded",
    progress: 1,
    result: { questions: lesson.quiz.length, mode: "mock" },
  });
}

async function runGenerateCourseContent(job: Job) {
  const course = store.getCourseMutable(job.courseId);
  if (!course) throw new Error("missing course");
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
    result: { enqueued },
  });
  kickJobs();
}
