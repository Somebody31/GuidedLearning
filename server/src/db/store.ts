// In-memory database for the demo.
// Everything lives in Maps/arrays. Restart the server and the seed course comes back.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { env } from "../env";
import type {
  Chunk,
  Course,
  EvalSample,
  Job,
  JobType,
  QuizAttemptRecord,
  SourcePage,
  StudySession,
} from "../types";
import { createCnSeedCourse, CN_COURSE_ID } from "./seed-cn";

function ensureDataDirs() {
  mkdirSync(join(env.DATA_DIR, "uploads"), { recursive: true });
  mkdirSync(join(env.DATA_DIR, "tmp"), { recursive: true });
}

class MemoryStore {
  courses = new Map<string, Course>();
  jobs = new Map<string, Job>();
  pages = new Map<string, SourcePage[]>(); // sourceId -> pages
  chunks = new Map<string, Chunk[]>(); // courseId -> chunks
  sessions = new Map<string, StudySession>();
  attempts: QuizAttemptRecord[] = [];
  evals: EvalSample[] = [];
  /** `${courseId}:${lessonId}` -> attempts (soft counter; reset on open) */
  attemptCounters = new Map<string, number>();

  constructor() {
    ensureDataDirs();
    const seed = createCnSeedCourse();
    this.courses.set(seed.id, structuredClone(seed));
  }

  listCourses(): Course[] {
    return [...this.courses.values()].map((c) => structuredClone(c));
  }

  getCourse(id: string): Course | undefined {
    const c = this.courses.get(id);
    return c ? structuredClone(c) : undefined;
  }

  // Same course object the server will change (not a copy).
  getCourseMutable(id: string): Course | undefined {
    return this.courses.get(id);
  }

  upsertCourse(course: Course): Course {
    this.courses.set(course.id, structuredClone(course));
    return structuredClone(course);
  }

  createCourse(title: string): Course {
    const id = `course-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const course: Course = {
      id,
      title: title.trim() || "Untitled course",
      lifecycle: "draft",
      lastStudiedAt: null,
      createdAt: now,
      graphVersion: 0,
      sessionDefaultMinutes: 25,
      units: [],
      lessons: {},
      sources: [],
    };
    return this.upsertCourse(course);
  }

  listJobs(courseId: string): Job[] {
    return [...this.jobs.values()]
      .filter((j) => j.courseId === courseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((j) => structuredClone(j));
  }

  getJob(id: string): Job | undefined {
    const j = this.jobs.get(id);
    return j ? structuredClone(j) : undefined;
  }

  enqueueJob(partial: {
    type: JobType;
    courseId: string;
    sourceId?: string;
    lessonId?: string;
  }): Job {
    const now = new Date().toISOString();
    const job: Job = {
      id: `job-${crypto.randomUUID().slice(0, 8)}`,
      status: "queued",
      progress: 0,
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
    this.jobs.set(job.id, job);
    return structuredClone(job);
  }

  updateJob(id: string, patch: Partial<Job>): Job | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(job);
  }

  setPages(sourceId: string, pages: SourcePage[]) {
    this.pages.set(sourceId, pages);
  }

  getPages(sourceId: string): SourcePage[] {
    return this.pages.get(sourceId) ?? [];
  }

  setChunks(courseId: string, chunks: Chunk[]) {
    this.chunks.set(courseId, chunks);
  }

  getChunks(courseId: string): Chunk[] {
    return this.chunks.get(courseId) ?? [];
  }

  appendChunks(courseId: string, chunks: Chunk[]) {
    const prev = this.chunks.get(courseId) ?? [];
    const withoutSource = prev.filter(
      (c) => !chunks.some((n) => n.sourceId === c.sourceId),
    );
    this.chunks.set(courseId, [...withoutSource, ...chunks]);
  }

  saveSession(session: StudySession) {
    this.sessions.set(session.id, structuredClone(session));
  }

  getSession(id: string): StudySession | undefined {
    const s = this.sessions.get(id);
    return s ? structuredClone(s) : undefined;
  }

  getSessionMutable(id: string): StudySession | undefined {
    return this.sessions.get(id);
  }

  addAttempt(a: QuizAttemptRecord) {
    this.attempts.push(a);
  }

  listAttempts(courseId: string, lessonId?: string): QuizAttemptRecord[] {
    return this.attempts.filter(
      (a) =>
        a.courseId === courseId &&
        (lessonId ? a.lessonId === lessonId : true),
    );
  }

  addEval(e: EvalSample) {
    this.evals.push(e);
  }

  listEvals(courseId: string): EvalSample[] {
    return this.evals.filter((e) => e.courseId === courseId);
  }

  private attemptKey(courseId: string, lessonId: string) {
    return `${courseId}:${lessonId}`;
  }

  bumpAttemptCounter(courseId: string, lessonId: string): number {
    const key = this.attemptKey(courseId, lessonId);
    const n = (this.attemptCounters.get(key) ?? 0) + 1;
    this.attemptCounters.set(key, n);
    return n;
  }

  resetAttemptCounter(courseId: string, lessonId: string) {
    this.attemptCounters.set(this.attemptKey(courseId, lessonId), 0);
  }
}

export const store = new MemoryStore();
export { CN_COURSE_ID };
