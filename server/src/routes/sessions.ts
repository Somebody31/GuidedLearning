import { Hono } from "hono";
import { z } from "zod";
import { store } from "../db/store";
import type { Lesson } from "../types";

export const sessionsRoutes = new Hono();

sessionsRoutes.get("/:sessionId", (c) => {
  const session = store.getSession(c.req.param("sessionId"));
  if (!session) return c.json({ error: "Session not found" }, 404);
  const course = store.getCourse(session.courseId);
  return c.json({ session, courseTitle: course?.title });
});

sessionsRoutes.patch("/:sessionId", async (c) => {
  const session = store.getSessionMutable(c.req.param("sessionId"));
  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.completedAt) {
    return c.json({ error: "Session already completed" }, 409);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      action: z.enum(["skip", "complete_item", "finish"]),
      lessonId: z.string().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const course = store.getCourseMutable(session.courseId);
  if (!course) return c.json({ error: "Course not found" }, 404);

  if (parsed.data.action === "finish") {
    session.completedAt = new Date().toISOString();
    session.pack = [];
    return c.json({ session: structuredClone(session) });
  }

  const head = session.pack[0];
  const lessonId = parsed.data.lessonId ?? head?.lessonId;
  if (!lessonId || head?.lessonId !== lessonId) {
    return c.json({ error: "lessonId must match current pack head" }, 400);
  }

  if (parsed.data.action === "skip") {
    if (session.skips >= 2) {
      return c.json({ error: "Defer limit for this pack (2)" }, 429);
    }
    session.skips += 1;
    session.deferredIds.push(lessonId);
    const lesson = course.lessons[lessonId] as Lesson | undefined;
    if (lesson) {
      lesson.status = "deferred";
      const until = new Date();
      until.setUTCDate(until.getUTCDate() + 1);
      lesson.deferredUntil = until.toISOString();
    }
    session.pack = session.pack.slice(1);
    if (session.pack.length === 0) {
      session.completedAt = new Date().toISOString();
    }
    return c.json({ session: structuredClone(session) });
  }

  // complete_item — pop head after quiz done (client signals)
  session.pack = session.pack.slice(1);
  if (session.pack.length === 0) {
    session.completedAt = new Date().toISOString();
  }
  course.lastStudiedAt = new Date().toISOString();
  return c.json({ session: structuredClone(session) });
});
