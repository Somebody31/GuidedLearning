import type { LessonStatus } from "./types";

export const STATUS_LABEL: Record<LessonStatus, string> = {
  locked: "Locked",
  available: "Ready",
  in_progress: "Active",
  due: "Due",
  weak: "Weak",
  mastered: "Mastered",
  remediation: "Remediation",
  deferred: "Deferred",
};

export const STATUS_COLOR: Record<LessonStatus, string> = {
  locked: "var(--state-locked)",
  available: "var(--state-available)",
  in_progress: "var(--state-progress)",
  due: "var(--state-due)",
  weak: "var(--state-weak)",
  mastered: "var(--state-mastered)",
  remediation: "var(--state-remediation)",
  deferred: "var(--state-deferred)",
};
