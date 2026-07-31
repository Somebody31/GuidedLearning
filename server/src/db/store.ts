import { createCnSeedCourse, CN_COURSE_ID } from "./seed-cn";
import type { Course, Job } from "../types";

/** B0 in-memory store. Swap for Postgres in B1+ without changing route signatures. */
class MemoryStore {
  courses = new Map<string, Course>();
  jobs = new Map<string, Job>();

  constructor() {
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

  enqueueJob(
    partial: Omit<Job, "id" | "status" | "progress" | "createdAt" | "updatedAt">,
  ): Job {
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
}

export const store = new MemoryStore();
export { CN_COURSE_ID };
