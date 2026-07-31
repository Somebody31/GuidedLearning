import { Hono } from "hono";
import { z } from "zod";
import { store } from "../db/store";
import { buildSessionPack } from "../services/packer";

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
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      title: z.string().min(1).max(80).optional(),
      sessionDefaultMinutes: z.union([
        z.literal(15),
        z.literal(25),
        z.literal(45),
        z.literal(60),
      ]).optional(),
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
  store.upsertCourse(course);
  return c.json({ course });
});

coursesRoutes.get("/:id/sources", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({ sources: course.sources });
});

coursesRoutes.get("/:id/jobs", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json({ jobs: store.listJobs(course.id) });
});

coursesRoutes.get("/:id/session-pack", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const budgetRaw = c.req.query("budget");
  const budget = budgetRaw
    ? Number(budgetRaw)
    : course.sessionDefaultMinutes;
  if (!Number.isFinite(budget) || budget < 5 || budget > 180) {
    return c.json({ error: "budget must be 5–180 minutes" }, 400);
  }
  const pack = buildSessionPack(course, budget);
  const usedMinutes = pack.reduce((sum, item) => {
    const lesson = course.lessons[item.lessonId];
    return sum + (lesson?.estMinutes ?? 0);
  }, 0);
  return c.json({
    budgetMinutes: budget,
    usedMinutes,
    pack,
  });
});

coursesRoutes.get("/:id/lessons/:lessonId", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  const unit = course.units.find((u) => u.id === lesson.unitId) ?? null;
  return c.json({ lesson, unit, courseId: course.id, courseTitle: course.title });
});

coursesRoutes.get("/:id/lessons/:lessonId/quiz", (c) => {
  const course = store.getCourse(c.req.param("id"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  const lesson = course.lessons[c.req.param("lessonId")];
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  if (!lesson.quizReady || lesson.quiz.length === 0) {
    return c.json({ error: "Quiz not ready", quizReady: false }, 409);
  }
  // Strip correct answers for client? For B0 return full (UI already has them in mock).
  // Phase B4 should omit correctOptionId until submit.
  return c.json({
    lessonId: lesson.id,
    title: lesson.title,
    quizReady: true,
    questions: lesson.quiz,
    masteryBefore: lesson.mastery,
  });
});
