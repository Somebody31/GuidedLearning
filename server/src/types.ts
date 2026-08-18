// Shared types for the API. Keep these names in sync with web/src/lib/types.ts

export type LessonStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "due"
  | "weak"
  | "mastered"
  | "remediation"
  | "deferred";

export type CourseLifecycle = "draft" | "draft_saved" | "activated";

export type CourseKind = "document" | "code";

export interface Citation {
  id: string;
  sourceId: string;
  sourceName: string;
  page: number;
  locator?: string;
  excerpt?: string;
  chunkId?: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  stem: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  estMinutes: number;
  status: LessonStatus;
  mastery: number;
  difficulty: number;
  packPriority: number;
  nextReviewAt?: string;
  objectives: string[];
  sections: { heading: string; body: string }[];
  citations: Citation[];
  quiz: QuizQuestion[];
  quizReady: boolean;
  deferredUntil?: string;
  position?: { x: number; y: number };
  contentVersion: number;
}

export interface Unit {
  id: string;
  title: string;
  order: number;
  lessonIds: string[];
}

export interface SourceFile {
  id: string;
  name: string;
  pages: number;
  status: "queued" | "parsing" | "ready" | "failed";
  lastUsed?: string;
  storageKey?: string;
  bytes?: number;
  error?: string;
}

export interface Course {
  id: string;
  title: string;
  kind: CourseKind;
  lifecycle: CourseLifecycle;
  lastStudiedAt: string | null;
  createdAt: string;
  activatedAt?: string;
  graphVersion: number;
  units: Unit[];
  lessons: Record<string, Lesson>;
  sources: SourceFile[];
  sessionDefaultMinutes: number;
}

export interface SessionPackItem {
  lessonId: string;
  kind: "review" | "new" | "weak" | "resume";
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type JobType =
  | "parse_source"
  | "draft_graph"
  | "generate_lesson"
  | "generate_quiz"
  | "generate_course_content"
  | "reembed";

export interface Job {
  id: string;
  type: JobType;
  courseId: string;
  sourceId?: string;
  lessonId?: string;
  status: JobStatus;
  progress: number;
  error?: string;
  result?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SourcePage {
  sourceId: string;
  page: number;
  text: string;
}

export interface Chunk {
  id: string;
  courseId: string;
  sourceId: string;
  sourceName: string;
  pageStart: number;
  pageEnd: number;
  text: string;
  embedding: number[];
}

export interface StudySession {
  id: string;
  courseId: string;
  budgetMinutes: number;
  pack: SessionPackItem[];
  skips: number;
  deferredIds: string[];
  startedAt: string;
  completedAt?: string;
}

export interface QuizAttemptRecord {
  id: string;
  courseId: string;
  lessonId: string;
  sessionId?: string;
  attemptIndex: number;
  score: number;
  answers: Record<string, string>;
  masteryBefore: number;
  masteryAfter: number;
  createdAt: string;
}

export interface EvalSample {
  id: string;
  courseId: string;
  claim: string;
  chunkId?: string;
  faithful: boolean | null;
  createdAt: string;
}
