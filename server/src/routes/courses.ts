import { Hono } from "hono";
import { z } from "zod";
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
import type { Lesson, StudySession } from "../types";

export const coursesRoutes = new Hono();

coursesRoutes.get("/", (c) => {
  const courses = store.listCourses().map((course) => ({
    id: course.id,
    title: course.title,
    lifecycle: course.lifecycle,
    lastStudiedAt: course.lastStudiedAt,
    createdAt: course.createdAt,
    sessionDefaultMinutes: course.sessionDefaultMinutes,
    lessonCount: Object.keys(course.lessons).length,
    dueCount: Object.values(course.lessons).filter((l) => l.status === "due")
      .length,
    weakCount: Object.values(course.lessons).filter((l) => l.status === "weak")
      .length,
    masteredCount: Object.values(course.lessons).filter(
      (l) => l.status === "mastered",
    ).length,
  }));
  return c.json({ courses });
});

coursesRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({ title: z.string().min(1).max(80).optional() })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }
  const course = store.createCourse(parsed.data.title ?? "Untitled course");
  return c.json({ course }, 201);
});

coursesRoutes.get("/:id", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({ course });
});

coursesRoutes.patch("/:id", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      title: z.string().min(1).max(80).optional(),
      sessionDefaultMinutes: z
        .union([
          z.literal(15),
          z.literal(25),
          z.literal(45),
          z.literal(60),
        ])
        .optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }
  if (parsed.data.title !== undefined) course.title = parsed.data.title.trim();
  if (parsed.data.sessionDefaultMinutes !== undefined) {
    course.sessionDefaultMinutes = parsed.data.sessionDefaultMinutes;
  }
  if (course.lifecycle === "draft") course.lifecycle = "draft_saved";
  return c.json({ course: structuredClone(course) });
});

// —— Sources / upload ——
coursesRoutes.get("/:id/sources", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({ sources: course.sources });
});

coursesRoutes.post("/:id/sources", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (course.lifecycle === "activated") {
    // v1: allow append as draft sources still (parse only); graph delta later
  }

  const form = await c.req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const single = form.get("file");
  if (single instanceof File) files.push(single);
  if (files.length === 0) {
    return c.json({ error: "No files (use field files or file)" }, 400);
  }

  const created = [];
  for (const file of files) {
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

coursesRoutes.post("/:id/sources/:sid/retry", (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const source = course.sources.find((s) => s.id === c.req.param("sid"));
  if (!source) return c.json({ error: "Source not found" }, 404);
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

// —— Build graph ——
coursesRoutes.post("/:id/build", (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (course.lifecycle === "activated") {
    return c.json({ error: "Course already activated" }, 409);
  }
  const ready = course.sources.filter((s) => s.status === "ready").length;
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

coursesRoutes.get("/:id/jobs", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({ jobs: store.listJobs(course.id) });
});

// —— Graph confirm ——
coursesRoutes.get("/:id/graph", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({
    lifecycle: course.lifecycle,
    graphVersion: course.graphVersion,
    units: course.units,
    lessons: Object.fromEntries(
      Object.entries(course.lessons).map(([id, l]) => [
        id,
        { id: l.id, unitId: l.unitId, title: l.title, estMinutes: l.estMinutes },
      ]),
    ),
  });
});

coursesRoutes.patch("/:id/graph", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (course.lifecycle === "activated") {
    return c.json({ error: "Graph frozen after activate" }, 409);
  }
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      units: z
        .array(
          z.object({
            id: z.string(),
            title: z.string().min(1).max(120),
            order: z.number().int().nonnegative(),
            lessonIds: z.array(z.string()),
          }),
        )
        .optional(),
      lessonTitles: z.record(z.string(), z.string().max(80)).optional(),
      estMinutes: z.record(z.string(), z.number().int().min(5).max(120)).optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  if (parsed.data.units) {
    course.units = parsed.data.units;
  }
  if (parsed.data.lessonTitles) {
    for (const [id, title] of Object.entries(parsed.data.lessonTitles)) {
      const lesson = course.lessons[id];
      if (lesson && title.trim()) lesson.title = title.trim();
    }
  }
  if (parsed.data.estMinutes) {
    for (const [id, mins] of Object.entries(parsed.data.estMinutes)) {
      const lesson = course.lessons[id];
      if (lesson) lesson.estMinutes = mins;
    }
  }
  course.lifecycle = "draft_saved";
  return c.json({
    ok: true,
    lifecycle: course.lifecycle,
    emptyTitles: Object.values(course.lessons).filter((l) => !l.title.trim())
      .length,
  });
});

coursesRoutes.post("/:id/activate", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (course.lifecycle === "activated") {
    return c.json({ course: structuredClone(course) });
  }
  if (Object.keys(course.lessons).length === 0) {
    return c.json({ error: "No lessons to activate" }, 400);
  }
  const empty = Object.values(course.lessons).filter((l) => !l.title.trim());
  if (empty.length) {
    return c.json(
      { error: `${empty.length} empty lesson title(s)`, emptyIds: empty.map((l) => l.id) },
      400,
    );
  }

  initLessonStatesOnActivate(course.lessons, course.units);
  course.lifecycle = "activated";
  course.activatedAt = new Date().toISOString();
  course.graphVersion += 1;

  // Ensure content exists
  store.enqueueJob({ type: "generate_course_content", courseId: course.id });
  kickJobs();

  return c.json({ course: structuredClone(course) });
});

// —— Session pack / sessions ——
coursesRoutes.get("/:id/session-pack", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const budgetRaw = c.req.query("budget");
  const budget = budgetRaw ? Number(budgetRaw) : course.sessionDefaultMinutes;
  if (!Number.isFinite(budget) || budget < 5 || budget > 180) {
    return c.json({ error: "budget must be 5–180 minutes" }, 400);
  }
  const pack = buildSessionPack(course, budget);
  const usedMinutes = pack.reduce((sum, item) => {
    const lesson = course.lessons[item.lessonId];
    return sum + (lesson?.estMinutes ?? 0);
  }, 0);
  return c.json({ budgetMinutes: budget, usedMinutes, pack });
});

coursesRoutes.post("/:id/sessions", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({ budgetMinutes: z.number().int().min(5).max(180).optional() })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body" }, 400);
  }
  const budget = parsed.data.budgetMinutes ?? course.sessionDefaultMinutes;
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

// —— Lessons ——
coursesRoutes.get("/:id/lessons/:lessonId", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  const unit = course.units.find((u) => u.id === lesson.unitId) ?? null;
  return c.json({
    lesson,
    unit,
    courseId: course.id,
    courseTitle: course.title,
  });
});

coursesRoutes.post("/:id/lessons/:lessonId/open", (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  if (lesson.status === "locked") {
    return c.json({ error: "Lesson locked" }, 409);
  }
  if (
    lesson.status === "available" ||
    lesson.status === "due" ||
    lesson.status === "weak"
  ) {
    if (lesson.status === "available") lesson.status = "in_progress";
  }
  course.lastStudiedAt = new Date().toISOString();
  store.resetAttemptCounter(course.id, lesson.id);
  if (!lesson.sections.length || !lesson.quizReady) {
    store.enqueueJob({
      type: "generate_lesson",
      courseId: course.id,
      lessonId: lesson.id,
    });
    kickJobs();
  }
  return c.json({ lesson: structuredClone(lesson) });
});

coursesRoutes.get("/:id/lessons/:lessonId/quiz", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  if (!lesson.quizReady || lesson.quiz.length === 0) {
    return c.json({ error: "Quiz not ready", quizReady: false }, 409);
  }
  // Omit correct answers for clients that grade server-side
  const questions = lesson.quiz.map((q) => ({
    id: q.id,
    stem: q.stem,
    options: q.options,
  }));
  return c.json({
    lessonId: lesson.id,
    title: lesson.title,
    quizReady: true,
    questions,
    masteryBefore: lesson.mastery,
    attemptHint: "Submit answers to grade server-side (max 3 attempts).",
  });
});

coursesRoutes.post("/:id/lessons/:lessonId/quiz/submit", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  if (!lesson.quizReady) {
    return c.json({ error: "Quiz not ready" }, 409);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      answers: z.record(z.string(), z.string()),
      sessionId: z.string().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const attemptIndex = store.bumpAttemptCounter(course.id, lesson.id);
  if (attemptIndex > 3) {
    return c.json({ error: "Max 3 attempts per lesson session" }, 429);
  }

  const score = scoreAnswers(lesson.quiz, parsed.data.answers);
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
    sessionId: parsed.data.sessionId,
    attemptIndex,
    score,
    answers: parsed.data.answers,
    masteryBefore: applied.masteryBefore,
    masteryAfter: applied.masteryAfter,
    createdAt: new Date().toISOString(),
  };
  store.addAttempt(record);

  // Reveal for result UI
  const graded = lesson.quiz.map((q) => ({
    id: q.id,
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
    selected: parsed.data.answers[q.id] ?? null,
    correct: parsed.data.answers[q.id] === q.correctOptionId,
  }));

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

// —— Diagnostic ——
coursesRoutes.post("/:id/diagnostic/start", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const titles = Object.values(course.lessons).map((l) => l.title);
  const lessonIds = Object.keys(course.lessons);
  const items = mockDiagnosticItems(titles).map((item, i) => ({
    ...item,
    lessonId: lessonIds[i] ?? item.lessonId,
  }));
  return c.json({ items, note: "Offline diagnostic — no live LLM." });
});

coursesRoutes.post("/:id/diagnostic/submit", async (c) => {
  const course = store.getCourseMutable(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      placements: z.array(
        z.object({
          lessonId: z.string(),
          choice: z.enum(["strong", "ok", "weak", "skip"]),
        }),
      ),
    })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }
  for (const p of parsed.data.placements) {
    const lesson = course.lessons[p.lessonId];
    if (lesson) applyDiagnosticPlacement(lesson, p.choice);
  }
  return c.json({ course: structuredClone(course) });
});

// —— Insights ——
coursesRoutes.get("/:id/insights", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({
    insights: buildInsights(course, store.listEvals(course.id)),
  });
});
