// Study session routes: look at a pack, skip a lesson, or finish.

import { Hono } from "hono";
import { store } from "../db/store";
import type { Lesson } from "../types";

export const sessionsRoutes = new Hono();

// GET /v1/sessions/:sessionId
sessionsRoutes.get("/:sessionId", (c) => {
  const session = store.getSession(c.req.param("sessionId"));
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }
  const course = store.getCourse(session.courseId);
  return c.json({ session, courseTitle: course?.title });
});

// PATCH /v1/sessions/:sessionId
// body: { action: "skip" | "complete_item" | "finish", lessonId?: string }
sessionsRoutes.patch("/:sessionId", async (c) => {
  const session = store.getSessionMutable(c.req.param("sessionId"));
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }
  if (session.completedAt) {
    return c.json({ error: "Session already completed" }, 409);
  }

  let body: { action?: string; lessonId?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const action = body.action;
  if (action !== "skip" && action !== "complete_item" && action !== "finish") {
    return c.json({ error: "action must be skip, complete_item, or finish" }, 400);
  }

  const course = store.getCourseMutable(session.courseId);
  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  if (action === "finish") {
    session.completedAt = new Date().toISOString();
    session.pack = [];
    return c.json({ session: structuredClone(session) });
  }

  const firstItem = session.pack[0];
  const lessonId = body.lessonId ?? firstItem?.lessonId;
  if (!lessonId || firstItem?.lessonId !== lessonId) {
    return c.json({ error: "lessonId must match current pack head" }, 400);
  }

  if (action === "skip") {
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

  // complete_item — student finished this lesson/quiz
  session.pack = session.pack.slice(1);
  if (session.pack.length === 0) {
    session.completedAt = new Date().toISOString();
  }
  course.lastStudiedAt = new Date().toISOString();
  return c.json({ session: structuredClone(session) });
});
