// Shared shapes used by the website pages.

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

export interface Citation {
  id: string;
  sourceId: string;
  sourceName: string;
  page: number;
  excerpt?: string;
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
  objectives: string[];
  sections: { heading: string; body: string }[];
  citations: Citation[];
  quiz: QuizQuestion[];
  quizReady: boolean;
  deferredUntil?: string;
  position?: { x: number; y: number };
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
}

export interface Course {
  id: string;
  title: string;
  lifecycle: CourseLifecycle;
  lastStudiedAt: string | null;
  createdAt: string;
  units: Unit[];
  lessons: Record<string, Lesson>;
  sources: SourceFile[];
  sessionDefaultMinutes: number;
}

// List endpoint returns counts, not the full lesson map.
export interface CourseSummary {
  id: string;
  title: string;
  lifecycle: CourseLifecycle;
  lastStudiedAt: string | null;
  createdAt: string;
  sessionDefaultMinutes: number;
  lessonCount: number;
  dueCount: number;
  weakCount: number;
  masteredCount: number;
}

export interface SessionPackItem {
  lessonId: string;
  kind: "review" | "new" | "weak" | "resume";
}
