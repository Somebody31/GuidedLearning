// Tiny client for the GuidedLearning API (default: http://localhost:8787).

import type { Course, CourseSummary, Lesson, Unit } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8787";

// Seeded sample course. Any other subject is a new course from PDFs.
export const DEMO_COURSE_ID = "cn-kurose";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isForm = init?.body instanceof FormData;
  if (init?.body && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });

  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function listCourses(): Promise<CourseSummary[]> {
  const data = await api<{ courses: CourseSummary[] }>("/v1/courses");
  return data.courses;
}

export async function getCourse(id: string): Promise<Course | null> {
  const res = await fetch(`${API_URL}/v1/courses/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  let data: { error?: string; course?: Course } = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data.course ?? null;
}

export async function getLesson(courseId: string, lessonId: string) {
  return api<{
    lesson: Lesson;
    unit: Unit | null;
    courseId: string;
    courseTitle: string;
  }>(`/v1/courses/${courseId}/lessons/${lessonId}`);
}