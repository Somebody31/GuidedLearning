// Demo Computer Networks course loaded when the server starts.

import type { Course, Lesson, LessonStatus } from "../types";

export const CN_COURSE_ID = "cn-kurose";

export function createCnSeedCourse(): Course {
  return {
    id: CN_COURSE_ID,
    title: "Computer Networks",
    lifecycle: "activated",
    lastStudiedAt: "2026-07-30T18:40:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    activatedAt: "2026-07-01T12:00:00.000Z",
    graphVersion: 1,
    sessionDefaultMinutes: 25,
    sources: [
      {
        id: "src-1",
        name: "Kurose-Ross-ch3-transport.pdf",
        pages: 86,
        status: "ready",
        lastUsed: "2026-07-30",
      },
      {
        id: "src-2",
        name: "Lecture-05-TCP.pdf",
        pages: 42,
        status: "ready",
        lastUsed: "2026-07-29",
      },
      {
        id: "src-3",
        name: "Lecture-02-HTTP.pdf",
        pages: 28,
        status: "ready",
      },
    ],
    units: [
      {
        id: "u-intro",
        title: "Introduction & edge",
        order: 0,
        lessonIds: ["l-internet", "l-delay", "l-layers"],
      },
      {
        id: "u-app",
        title: "Application",
        order: 1,
        lessonIds: ["l-http", "l-dns", "l-smtp"],
      },
      {
        id: "u-transport",
        title: "Transport",
        order: 2,
        lessonIds: ["l-udp", "l-tcp", "l-rdt", "l-congestion"],
      },
      {
        id: "u-network",
        title: "Network",
        order: 3,
        lessonIds: ["l-ip", "l-forward", "l-routing"],
      },
      {
        id: "u-link",
        title: "Link",
        order: 4,
        lessonIds: ["l-mac", "l-ethernet", "l-switch"],
      },
    ],
    lessons: {
      "l-internet": L("l-internet", "u-intro", "What is the Internet?", 10, "mastered", 0.92, 40, 40),
      "l-delay": L("l-delay", "u-intro", "Delay, loss, throughput", 12, "mastered", 0.88, 280, 40),
      "l-layers": L("l-layers", "u-intro", "Protocol layers", 12, "available", 0.35, 520, 40),
      "l-http": L("l-http", "u-app", "HTTP", 14, "due", 0.55, 40, 220),
      "l-dns": L("l-dns", "u-app", "DNS", 12, "in_progress", 0.4, 280, 220),
      "l-smtp": L("l-smtp", "u-app", "SMTP / IMAP overview", 10, "locked", 0, 520, 220, false),
      "l-udp": L("l-udp", "u-transport", "UDP", 10, "available", 0.2, 40, 400),
      "l-tcp": L("l-tcp", "u-transport", "TCP basics", 15, "weak", 0.42, 280, 400),
      "l-rdt": L("l-rdt", "u-transport", "Reliable data transfer", 16, "locked", 0, 520, 400, false),
      "l-congestion": L("l-congestion", "u-transport", "TCP congestion control", 18, "due", 0.38, 760, 400),
      "l-ip": L("l-ip", "u-network", "IP addressing", 12, "locked", 0, 40, 580, false),
      "l-forward": L("l-forward", "u-network", "Forwarding vs routing", 12, "locked", 0, 280, 580, false),
      "l-routing": L("l-routing", "u-network", "Routing ideas", 14, "locked", 0, 520, 580, false),
      "l-mac": L("l-mac", "u-link", "Multiple access", 12, "locked", 0, 40, 760, false),
      "l-ethernet": L("l-ethernet", "u-link", "Ethernet / MAC", 12, "locked", 0, 280, 760, false),
      "l-switch": L("l-switch", "u-link", "Switches", 10, "locked", 0, 520, 760, false),
    },
  };
}

function L(
  id: string,
  unitId: string,
  title: string,
  estMinutes: number,
  status: LessonStatus,
  mastery: number,
  x: number,
  y: number,
  quizReady = true,
): Lesson {
  return {
    id,
    unitId,
    title,
    estMinutes,
    status,
    mastery,
    difficulty: 0,
    packPriority: status === "available" && mastery > 0 ? 10 : 0,
    objectives: [`Explain core ideas of ${title}`],
    sections: quizReady
      ? [
          {
            heading: "Overview",
            body: `${title} — seed content (offline). Live RAG uses DeepSeek only when USE_LIVE_AI=true.`,
          },
        ]
      : [],
    citations: quizReady
      ? [
          {
            id: `${id}-c1`,
            sourceId: "src-1",
            sourceName: "Kurose-Ross-ch3-transport.pdf",
            page: 1,
            excerpt: "Seed citation for API smoke tests.",
          },
        ]
      : [],
    quiz: quizReady
      ? [
          {
            id: `${id}-q1`,
            stem: `Which statement best matches ${title}?`,
            options: [
              { id: "a", text: "Unrelated trivia" },
              { id: "b", text: "A grounded core concept from the sources" },
              { id: "c", text: "A link-layer only claim" },
              { id: "d", text: "An application-layer only claim" },
            ],
            correctOptionId: "b",
            explanation: "Demo quiz item (mock generator).",
          },
          {
            id: `${id}-q2`,
            stem: `A common exam pitfall for ${title} is…`,
            options: [
              { id: "a", text: "Confusing related but distinct concepts" },
              { id: "b", text: "Never reading the problem" },
              { id: "c", text: "Using only layer-1 terms" },
              { id: "d", text: "Ignoring units entirely" },
            ],
            correctOptionId: "a",
            explanation: "Pitfall items keep difficulty signal without live LLM.",
          },
        ]
      : [],
    quizReady,
    position: { x, y },
    contentVersion: 1,
  };
}
