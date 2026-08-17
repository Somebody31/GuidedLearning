// Course data lives in Maps. DATA_STORE=file writes a JSON snapshot so restarts keep work.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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

export type StoreSnapshot = {
  version: 1;
  courses: Course[];
  pages: [string, SourcePage[]][];
  chunks: [string, Chunk[]][];
  sessions: StudySession[];
  attempts: QuizAttemptRecord[];
  evals: EvalSample[];
  attemptCounters: [string, number][];
};

export class MemoryStore {
  courses = new Map<string, Course>();
  jobs = new Map<string, Job>();
  pages = new Map<string, SourcePage[]>(); // sourceId -> pages
  chunks = new Map<string, Chunk[]>(); // courseId -> chunks
  sessions = new Map<string, StudySession>();
  attempts: QuizAttemptRecord[] = [];
  evals: EvalSample[] = [];
  /** `${courseId}:${lessonId}` -> attempts (soft counter; reset on open) */
  attemptCounters = new Map<string, number>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    ensureDataDirs();
    if (env.DATA_STORE === "file") this.loadFromDisk();
    this.ensureSeed();
    if (env.DATA_STORE === "file") {
      const flush = () => this.saveNow();
      process.on("SIGINT", () => {
        flush();
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        flush();
        process.exit(0);
      });
      process.on("beforeExit", flush);
    }
  }

  ensureSeed() {
    if (this.courses.has(CN_COURSE_ID)) return;
    const seed = createCnSeedCourse();
    this.courses.set(seed.id, structuredClone(seed));
    this.scheduleSave();
  }

  dump(): StoreSnapshot {
    return {
      version: 1,
      courses: [...this.courses.values()],
      pages: [...this.pages.entries()],
      chunks: [...this.chunks.entries()],
      sessions: [...this.sessions.values()],
      attempts: this.attempts,
      evals: this.evals,
      attemptCounters: [...this.attemptCounters.entries()],
    };
  }

  hydrate(data: StoreSnapshot) {
    this.courses = new Map((data.courses ?? []).map((c) => [c.id, c]));
    this.pages = new Map(data.pages ?? []);
    this.chunks = new Map(data.chunks ?? []);
    this.sessions = new Map((data.sessions ?? []).map((s) => [s.id, s]));
    this.attempts = data.attempts ?? [];
    this.evals = data.evals ?? [];
    this.attemptCounters = new Map(data.attemptCounters ?? []);
    // Jobs are not persisted. Stuck parse rows become retryable.
    for (const course of this.courses.values()) {
      for (const source of course.sources) {
        if (source.status === "queued" || source.status === "parsing") {
          source.status = "failed";
          source.error = "Server restarted during parse — retry";
        }
      }
    }
  }

  snapshotPath() {
    return join(env.DATA_DIR, "store.json");
  }

  loadFromDisk() {
    try {
      const raw = readFileSync(this.snapshotPath(), "utf8");
      const data = JSON.parse(raw) as StoreSnapshot;
      if (!data || !Array.isArray(data.courses)) return;
      this.hydrate(data);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "ENOENT") console.error("store load failed", err);
    }
  }

  saveNow() {
    // ponytail: one JSON file, single process; split if you run multiple API workers
    if (env.DATA_STORE !== "file") return;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    ensureDataDirs();
    const dest = this.snapshotPath();
    const tmp = dest + ".tmp";
    writeFileSync(tmp, JSON.stringify(this.dump()));
    renameSync(tmp, dest);
  }

  scheduleSave() {
    if (env.DATA_STORE !== "file") return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 400);
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
