// All course API routes: list, upload PDFs, build map, study, quiz.

import { Hono } from "hono";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "../env";
import { store } from "../db/store";
import { buildSessionPack } from "../services/packer";
import { kickJobs } from "../jobs/runner";
import {
  applyDiagnosticPlacement,
  applyQuizAttempt,
  initLessonStatesOnActivate,
  scoreAnswers,
  unlockNextLessons,
} from "../services/scheduler";
import { buildInsights } from "../services/insights";
import { mockDiagnosticItems } from "../llm/mock";
import type { StudySession } from "../types";

export const coursesRoutes = new Hono();

// Try to read JSON. If the body is empty or invalid, return {}.
async function readJson(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

function countStatus(lessons: Record<string, { status: string }>, status: string) {
  let n = 0;
  for (const lesson of Object.values(lessons)) {
    if (lesson.status === status) n += 1;
  }
  return n;
}

// GET /v1/courses
coursesRoutes.get("/", (c) => {
  const courses = [];
  for (const course of store.listCourses()) {
    courses.push({
      id: course.id,
      title: course.title,
      lifecycle: course.lifecycle,
      lastStudiedAt: course.lastStudiedAt,
      createdAt: course.createdAt,
      sessionDefaultMinutes: course.sessionDefaultMinutes,
      lessonCount: Object.keys(course.lessons).length,
      dueCount: countStatus(course.lessons, "due"),
      weakCount: countStatus(course.lessons, "weak"),
      masteredCount: countStatus(course.lessons, "mastered"),
    });
  }
  return c.json({ courses });
});

// POST /v1/courses
coursesRoutes.post("/", async (c) => {
  const body = (await readJson(c)) as { title?: string };
  let title = "Untitled course";
  if (typeof body.title === "string" && body.title.trim()) {
    title = body.title.trim().slice(0, 80);
  }
  const course = store.createCourse(title);
  return c.json({ course }, 201);
});

// GET /v1/courses/:id
coursesRoutes.get("/:id", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  return c.json({ course });
});

// PATCH /v1/courses/:id
coursesRoutes.patch("/:id", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const body = (await readJson(c)) as {
    title?: string;
    sessionDefaultMinutes?: number;
  };

  if (typeof body.title === "string" && body.title.trim()) {
    course.title = body.title.trim().slice(0, 80);
  }

  const allowedBudgets = [15, 25, 45, 60];
  if (allowedBudgets.includes(body.sessionDefaultMinutes as number)) {
    course.sessionDefaultMinutes = body.sessionDefaultMinutes as 15 | 25 | 45 | 60;
  }

  if (course.lifecycle === "draft") {
    course.lifecycle = "draft_saved";
  }
  return c.json({ course: structuredClone(course) });
});

// GET /v1/courses/:id/sources
coursesRoutes.get("/:id/sources", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  return c.json({ sources: course.sources });
});

// POST /v1/courses/:id/sources  (upload PDF files)
coursesRoutes.post("/:id/sources", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const form = await c.req.formData();
  const files: File[] = [];
  for (const item of form.getAll("files")) {
    if (item instanceof File) files.push(item);
  }
  const single = form.get("file");
  if (single instanceof File) files.push(single);

  if (files.length === 0) {
    return c.json({ error: "No files (use field files or file)" }, 400);
  }

  const created = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".txt") && !lower.endsWith(".md")) {
      return c.json({ error: `${file.name} must be a .pdf, .txt, or .md file` }, 400);
    }
    if (file.size > 50 * 1024 * 1024) {
      return c.json({ error: `${file.name} exceeds 50MB` }, 400);
    }

    const sourceId = `src-${crypto.randomUUID().slice(0, 8)}`;
    const storageKey = `uploads/${course.id}/${sourceId}-${file.name}`;
    const dir = join(env.DATA_DIR, "uploads", course.id);
    await mkdir(dir, { recursive: true });
    const abs = join(env.DATA_DIR, storageKey);
    await writeFile(abs, Buffer.from(await file.arrayBuffer()));

    const source = {
      id: sourceId,
      name: file.name,
      pages: 0,
      status: "queued" as const,
      storageKey,
      bytes: file.size,
    };
    course.sources.push(source);
    const job = store.enqueueJob({
      type: "parse_source",
      courseId: course.id,
      sourceId,
    });
    created.push({ source, jobId: job.id });
  }

  kickJobs();
  return c.json({ uploaded: created }, 201);
});

// POST /v1/courses/:id/sources/:sid/retry
coursesRoutes.post("/:id/sources/:sid/retry", (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const source = course.sources.find((s) => s.id === c.req.param("sid"));
  if (!source) {
    return c.json({ error: "Source not found" }, 404);
  }
  source.status = "queued";
  source.error = undefined;
  const job = store.enqueueJob({
    type: "parse_source",
    courseId: course.id,
    sourceId: source.id,
  });
  kickJobs();
  return c.json({ job });
});

// POST /v1/courses/:id/build
coursesRoutes.post("/:id/build", (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  if (course.lifecycle === "activated") {
    return c.json({ error: "Course already activated" }, 409);
  }

  let ready = 0;
  for (const source of course.sources) {
    if (source.status === "ready") ready += 1;
  }
  if (ready === 0) {
    return c.json({ error: "Need at least one ready source" }, 400);
  }

  const job = store.enqueueJob({
    type: "draft_graph",
    courseId: course.id,
  });
  kickJobs();
  return c.json({ job }, 202);
});

// GET /v1/courses/:id/jobs
coursesRoutes.get("/:id/jobs", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  return c.json({ jobs: store.listJobs(course.id) });
});

// GET /v1/courses/:id/graph
coursesRoutes.get("/:id/graph", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const lessons: Record<string, { id: string; unitId: string; title: string; estMinutes: number }> = {};
  for (const [id, lesson] of Object.entries(course.lessons)) {
    lessons[id] = {
      id: lesson.id,
      unitId: lesson.unitId,
      title: lesson.title,
      estMinutes: lesson.estMinutes,
    };
  }

  return c.json({
    lifecycle: course.lifecycle,
    graphVersion: course.graphVersion,
    units: course.units,
    lessons,
  });
});

// PATCH /v1/courses/:id/graph
coursesRoutes.patch("/:id/graph", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  if (course.lifecycle === "activated") {
    return c.json({ error: "Graph frozen after activate" }, 409);
  }

  const body = (await readJson(c)) as {
    units?: typeof course.units;
    lessonTitles?: Record<string, string>;
    estMinutes?: Record<string, number>;
  };

  if (Array.isArray(body.units)) {
    course.units = body.units;
  }

  if (body.lessonTitles && typeof body.lessonTitles === "object") {
    for (const [id, title] of Object.entries(body.lessonTitles)) {
      const lesson = course.lessons[id];
      if (lesson && typeof title === "string" && title.trim()) {
        lesson.title = title.trim();
      }
    }
  }

  if (body.estMinutes && typeof body.estMinutes === "object") {
    for (const [id, mins] of Object.entries(body.estMinutes)) {
      const lesson = course.lessons[id];
      if (lesson && typeof mins === "number" && mins >= 5 && mins <= 120) {
        lesson.estMinutes = mins;
      }
    }
  }

  course.lifecycle = "draft_saved";

  let emptyTitles = 0;
  for (const lesson of Object.values(course.lessons)) {
    if (!lesson.title.trim()) emptyTitles += 1;
  }

  return c.json({
    ok: true,
    lifecycle: course.lifecycle,
    emptyTitles,
  });
});

// POST /v1/courses/:id/activate
coursesRoutes.post("/:id/activate", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  if (course.lifecycle === "activated") {
    return c.json({ course: structuredClone(course) });
  }
  if (Object.keys(course.lessons).length === 0) {
    return c.json({ error: "No lessons to activate" }, 400);
  }

  const emptyIds: string[] = [];
  for (const lesson of Object.values(course.lessons)) {
    if (!lesson.title.trim()) emptyIds.push(lesson.id);
  }
  if (emptyIds.length > 0) {
    return c.json(
      { error: `${emptyIds.length} empty lesson title(s)`, emptyIds },
      400,
    );
  }

  initLessonStatesOnActivate(course.lessons, course.units);
  course.lifecycle = "activated";
  course.activatedAt = new Date().toISOString();
  course.graphVersion += 1;

  store.enqueueJob({ type: "generate_course_content", courseId: course.id });
  kickJobs();

  return c.json({ course: structuredClone(course) });
});

// GET /v1/courses/:id/session-pack
coursesRoutes.get("/:id/session-pack", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const budgetRaw = c.req.query("budget");
  const budget = budgetRaw ? Number(budgetRaw) : course.sessionDefaultMinutes;
  if (!Number.isFinite(budget) || budget < 5 || budget > 180) {
    return c.json({ error: "budget must be 5–180 minutes" }, 400);
  }

  const pack = buildSessionPack(course, budget);
  let usedMinutes = 0;
  for (const item of pack) {
    const lesson = course.lessons[item.lessonId];
    if (lesson) usedMinutes += lesson.estMinutes;
  }
  return c.json({ budgetMinutes: budget, usedMinutes, pack });
});

// POST /v1/courses/:id/sessions
coursesRoutes.post("/:id/sessions", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const body = (await readJson(c)) as { budgetMinutes?: number };
  let budget = course.sessionDefaultMinutes;
  if (typeof body.budgetMinutes === "number") {
    budget = body.budgetMinutes;
  }
  if (!Number.isFinite(budget) || budget < 5 || budget > 180) {
    return c.json({ error: "budgetMinutes must be 5–180" }, 400);
  }

  const pack = buildSessionPack(course, budget);
  const session: StudySession = {
    id: `ses-${crypto.randomUUID().slice(0, 8)}`,
    courseId: course.id,
    budgetMinutes: budget,
    pack,
    skips: 0,
    deferredIds: [],
    startedAt: new Date().toISOString(),
  };
  store.saveSession(session);
  course.lastStudiedAt = session.startedAt;
  return c.json({ session }, 201);
});

// GET /v1/courses/:id/lessons/:lessonId
coursesRoutes.get("/:id/lessons/:lessonId", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }
  const unit = course.units.find((u) => u.id === lesson.unitId) ?? null;
  return c.json({
    lesson,
    unit,
    courseId: course.id,
    courseTitle: course.title,
  });
});

// POST /v1/courses/:id/lessons/:lessonId/open
coursesRoutes.post("/:id/lessons/:lessonId/open", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }
  if (lesson.status === "locked") {
    return c.json({ error: "Lesson locked" }, 409);
  }

  const body = (await readJson(c)) as { force?: boolean };
  const force = body.force === true || c.req.query("force") === "1";

  if (lesson.status === "available") {
    lesson.status = "in_progress";
  }
  course.lastStudiedAt = new Date().toISOString();
  store.resetAttemptCounter(course.id, lesson.id);

  if (force) {
    lesson.sections = [];
    lesson.citations = [];
    lesson.quiz = [];
    lesson.quizReady = false;
    lesson.objectives = [];
    lesson.contentVersion += 1;
  }

  if (!lesson.sections.length || !lesson.quizReady) {
    store.enqueueJob({
      type: "generate_lesson",
      courseId: course.id,
      lessonId: lesson.id,
    });
    kickJobs();
  }

  return c.json({ lesson: structuredClone(lesson), forced: force });
});

// POST /v1/courses/:id/reembed
coursesRoutes.post("/:id/reembed", (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const chunks = store.getChunks(course.id);
  if (chunks.length === 0) {
    return c.json({ error: "No chunks to reembed" }, 400);
  }
  const job = store.enqueueJob({
    type: "reembed",
    courseId: course.id,
  });
  kickJobs();
  return c.json({ job, chunkCount: chunks.length }, 202);
});

// GET /v1/courses/:id/lessons/:lessonId/quiz
coursesRoutes.get("/:id/lessons/:lessonId/quiz", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }
  if (!lesson.quizReady || lesson.quiz.length === 0) {
    return c.json({ error: "Quiz not ready", quizReady: false }, 409);
  }

  // Do not send the correct answers before they submit.
  const questions = [];
  for (const q of lesson.quiz) {
    questions.push({
      id: q.id,
      stem: q.stem,
      options: q.options,
    });
  }

  return c.json({
    lessonId: lesson.id,
    title: lesson.title,
    quizReady: true,
    questions,
    masteryBefore: lesson.mastery,
    attemptHint: "Submit answers to grade server-side (max 3 attempts).",
  });
});

// POST /v1/courses/:id/lessons/:lessonId/quiz/submit
coursesRoutes.post("/:id/lessons/:lessonId/quiz/submit", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }
  if (!lesson.quizReady) {
    return c.json({ error: "Quiz not ready" }, 409);
  }

  const body = (await readJson(c)) as {
    answers?: Record<string, string>;
    sessionId?: string;
  };
  if (!body.answers || typeof body.answers !== "object") {
    return c.json({ error: "answers must be an object" }, 400);
  }

  const attemptIndex = store.bumpAttemptCounter(course.id, lesson.id);
  if (attemptIndex > 3) {
    return c.json({ error: "Max 3 attempts per lesson session" }, 429);
  }

  const score = scoreAnswers(lesson.quiz, body.answers);
  const applied = applyQuizAttempt({
    lesson,
    score,
    attemptIndex,
  });

  lesson.mastery = applied.masteryAfter;
  lesson.status = applied.status;
  lesson.difficulty = applied.difficulty;
  lesson.nextReviewAt = applied.nextReviewAt;
  if (attemptIndex === 1 && score >= 0.7) {
    unlockNextLessons(course.lessons, course.units, lesson.id);
  }
  course.lastStudiedAt = new Date().toISOString();

  const record = {
    id: `att-${crypto.randomUUID().slice(0, 8)}`,
    courseId: course.id,
    lessonId: lesson.id,
    sessionId: body.sessionId,
    attemptIndex,
    score,
    answers: body.answers,
    masteryBefore: applied.masteryBefore,
    masteryAfter: applied.masteryAfter,
    createdAt: new Date().toISOString(),
  };
  store.addAttempt(record);

  const graded = [];
  for (const q of lesson.quiz) {
    const selected = body.answers[q.id] ?? null;
    graded.push({
      id: q.id,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      selected,
      correct: selected === q.correctOptionId,
    });
  }

  return c.json({
    attemptIndex,
    score,
    percent: Math.round(score * 100),
    ...applied,
    lesson: {
      id: lesson.id,
      status: lesson.status,
      mastery: lesson.mastery,
      nextReviewAt: lesson.nextReviewAt,
    },
    graded,
  });
});

// POST /v1/courses/:id/diagnostic/start
coursesRoutes.post("/:id/diagnostic/start", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  const titles = Object.values(course.lessons).map((l) => l.title);
  const lessonIds = Object.keys(course.lessons);
  const items = mockDiagnosticItems(titles).map((item, i) => ({
    ...item,
    lessonId: lessonIds[i] ?? item.lessonId,
  }));
  return c.json({ items, note: "Offline diagnostic — no live LLM." });
});

// POST /v1/courses/:id/diagnostic/submit
coursesRoutes.post("/:id/diagnostic/submit", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const body = (await readJson(c)) as {
    placements?: { lessonId?: string; choice?: string }[];
  };
  if (!Array.isArray(body.placements)) {
    return c.json({ error: "placements must be a list" }, 400);
  }

  const choices = ["strong", "ok", "weak", "skip"] as const;
  for (const p of body.placements) {
    if (!p.lessonId || !choices.includes(p.choice as (typeof choices)[number])) {
      continue;
    }
    const lesson = course.lessons[p.lessonId];
    if (lesson) {
      applyDiagnosticPlacement(lesson, p.choice as (typeof choices)[number]);
    }
  }
  return c.json({ course: structuredClone(course) });
});

// GET /v1/courses/:id/insights
coursesRoutes.get("/:id/insights", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }
  return c.json({
    insights: buildInsights(course, store.listEvals(course.id)),
  });
});
