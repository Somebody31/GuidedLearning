// Demo Computer Networks course used by the website.
// Later this can be replaced with real API data.

import type { Course, SessionPackItem } from "./types";

export const CN_COURSE_ID = "cn-kurose";

export const computerNetworksCourse: Course = {
  id: CN_COURSE_ID,
  title: "Computer Networks",
  lifecycle: "activated",
  lastStudiedAt: "2026-07-30T18:40:00.000Z",
  createdAt: "2026-07-01T10:00:00.000Z",
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
    "l-internet": {
      id: "l-internet",
      unitId: "u-intro",
      title: "What is the Internet?",
      estMinutes: 10,
      status: "mastered",
      mastery: 0.92,
      objectives: [
        "Describe hosts, packet switches, and ISPs",
        "Contrast network edge vs core",
      ],
      sections: [
        {
          heading: "Nuts and bolts",
          body: "The Internet is a network of networks. End systems (hosts) run applications and connect through access networks to the core of interconnected routers.",
        },
        {
          heading: "Services view",
          body: "From an application perspective, the Internet provides a communication infrastructure that makes distributed programs possible — web, email, streaming, and more.",
        },
      ],
      citations: [
        {
          id: "c1",
          sourceId: "src-1",
          sourceName: "Kurose-Ross-ch3-transport.pdf",
          page: 2,
          excerpt: "The Internet is a computer network that interconnects…",
        },
      ],
      quiz: [
        {
          id: "q1",
          stem: "Which devices forward packets in the network core?",
          options: [
            { id: "a", text: "Hosts only" },
            { id: "b", text: "Packet switches (routers/switches)" },
            { id: "c", text: "Only the DNS root" },
            { id: "d", text: "Application servers exclusively" },
          ],
          correctOptionId: "b",
          explanation: "Routers and link-layer switches forward packets through the core.",
        },
      ],
      quizReady: true,
      position: { x: 40, y: 40 },
    },
    "l-delay": {
      id: "l-delay",
      unitId: "u-intro",
      title: "Delay, loss, throughput",
      estMinutes: 12,
      status: "mastered",
      mastery: 0.88,
      objectives: ["Name the four delay components", "Relate loss to queue overflow"],
      sections: [
        {
          heading: "Delay components",
          body: "Nodal delay is the sum of processing, queueing, transmission, and propagation delay. Queueing varies with congestion.",
        },
      ],
      citations: [
        {
          id: "c2",
          sourceId: "src-1",
          sourceName: "Kurose-Ross-ch3-transport.pdf",
          page: 18,
        },
      ],
      quiz: [],
      quizReady: true,
      position: { x: 260, y: 40 },
    },
    "l-layers": {
      id: "l-layers",
      unitId: "u-intro",
      title: "Protocol layers",
      estMinutes: 12,
      status: "available",
      mastery: 0.35,
      objectives: ["List Internet protocol stack layers", "Explain encapsulation"],
      sections: [
        {
          heading: "Layering",
          body: "Application, transport, network, link, and physical layers each solve a piece of the communication problem. Encapsulation wraps data as it descends the stack.",
        },
      ],
      citations: [
        {
          id: "c3",
          sourceId: "src-2",
          sourceName: "Lecture-05-TCP.pdf",
          page: 4,
        },
      ],
      quiz: [
        {
          id: "q-layers",
          stem: "Which layer is responsible for process-to-process delivery?",
          options: [
            { id: "a", text: "Network" },
            { id: "b", text: "Transport" },
            { id: "c", text: "Link" },
            { id: "d", text: "Physical" },
          ],
          correctOptionId: "b",
          explanation: "Transport provides logical communication between processes.",
        },
      ],
      quizReady: true,
      position: { x: 480, y: 40 },
    },
    "l-http": {
      id: "l-http",
      unitId: "u-app",
      title: "HTTP",
      estMinutes: 14,
      status: "due",
      mastery: 0.55,
      objectives: ["Contrast persistent vs non-persistent HTTP", "Identify request methods"],
      sections: [
        {
          heading: "Request / response",
          body: "HTTP is a client-server application protocol. A request line, headers, and optional body form the request; the server replies with a status line and entity.",
        },
        {
          heading: "Exam pitfall",
          body: "Do not confuse cookies (state at the application layer) with TCP connections. See figure on p.12 in your lecture slides for the cookie jar diagram.",
        },
      ],
      citations: [
        {
          id: "c4",
          sourceId: "src-3",
          sourceName: "Lecture-02-HTTP.pdf",
          page: 9,
          excerpt:
            "HTTP is a stateless protocol: the server does not retain information about past client requests. Cookies and other application mechanisms may add state on top of HTTP.",
        },
        {
          id: "c5",
          sourceId: "src-3",
          sourceName: "Lecture-02-HTTP.pdf",
          page: 12,
          excerpt:
            "Figure: cookie jar — browser stores name/value pairs per domain; subsequent requests include Cookie headers. Do not confuse this application-layer state with TCP connection state.",
        },
      ],
      quiz: [
        {
          id: "q-http-1",
          stem: "HTTP is best described as:",
          options: [
            { id: "a", text: "A connection-oriented transport protocol" },
            { id: "b", text: "A stateless application-layer protocol" },
            { id: "c", text: "A routing algorithm" },
            { id: "d", text: "A physical signaling standard" },
          ],
          correctOptionId: "b",
          explanation: "HTTP itself does not retain state between requests; cookies add application state.",
        },
        {
          id: "q-http-2",
          stem: "Non-persistent HTTP typically opens how many TCP connections per object (classic model)?",
          options: [
            { id: "a", text: "Zero" },
            { id: "b", text: "One new connection per object" },
            { id: "c", text: "Exactly two forever" },
            { id: "d", text: "One shared UDP flow" },
          ],
          correctOptionId: "b",
          explanation: "Classic non-persistent HTTP uses a separate TCP connection per object.",
        },
      ],
      quizReady: true,
      position: { x: 40, y: 220 },
    },
    "l-dns": {
      id: "l-dns",
      unitId: "u-app",
      title: "DNS",
      estMinutes: 12,
      status: "in_progress",
      mastery: 0.4,
      objectives: ["Describe hierarchical DNS", "Explain iterative vs recursive queries"],
      sections: [
        {
          heading: "Hierarchy",
          body: "DNS maps hostnames to IP addresses using a distributed hierarchy: root, TLD, and authoritative name servers, with caching at resolvers.",
        },
      ],
      citations: [
        {
          id: "c6",
          sourceId: "src-3",
          sourceName: "Lecture-02-HTTP.pdf",
          page: 20,
        },
      ],
      quiz: [
        {
          id: "q-dns",
          stem: "A local DNS resolver that queries on behalf of the client is performing:",
          options: [
            { id: "a", text: "Only iterative queries always" },
            { id: "b", text: "A recursive query service for the client" },
            { id: "c", text: "Link-layer ARP only" },
            { id: "d", text: "BGP path selection" },
          ],
          correctOptionId: "b",
          explanation: "The client often issues a recursive query to its local resolver.",
        },
      ],
      quizReady: true,
      position: { x: 260, y: 220 },
    },
    "l-smtp": {
      id: "l-smtp",
      unitId: "u-app",
      title: "SMTP / IMAP overview",
      estMinutes: 10,
      status: "locked",
      mastery: 0,
      objectives: ["Separate push (SMTP) from access (IMAP/POP)"],
      sections: [
        {
          heading: "Mail transfer",
          body: "SMTP pushes mail between servers; IMAP/POP let users access mailboxes. They solve different parts of electronic mail.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: false,
      position: { x: 480, y: 220 },
    },
    "l-udp": {
      id: "l-udp",
      unitId: "u-transport",
      title: "UDP",
      estMinutes: 10,
      status: "available",
      mastery: 0.2,
      objectives: ["List UDP header fields", "When to choose UDP"],
      sections: [
        {
          heading: "Bare-bones transport",
          body: "UDP provides multiplexing and a checksum with no connection setup, no reliability, and no congestion control — useful for latency-sensitive apps.",
        },
      ],
      citations: [
        {
          id: "c7",
          sourceId: "src-1",
          sourceName: "Kurose-Ross-ch3-transport.pdf",
          page: 30,
        },
      ],
      quiz: [
        {
          id: "q-udp",
          stem: "UDP does not provide:",
          options: [
            { id: "a", text: "Port multiplexing" },
            { id: "b", text: "Optional checksum" },
            { id: "c", text: "Reliable byte-stream delivery" },
            { id: "d", text: "A simple header" },
          ],
          correctOptionId: "c",
          explanation: "Reliability is a TCP (or application) concern, not UDP's.",
        },
      ],
      quizReady: true,
      position: { x: 40, y: 400 },
    },
    "l-tcp": {
      id: "l-tcp",
      unitId: "u-transport",
      title: "TCP basics",
      estMinutes: 15,
      status: "weak",
      mastery: 0.42,
      objectives: ["Three-way handshake", "Reliable data transfer overview"],
      sections: [
        {
          heading: "Connection-oriented",
          body: "TCP establishes a connection with SYN/SYN-ACK/ACK, then provides a reliable, ordered byte stream with flow control.",
        },
      ],
      citations: [
        {
          id: "c8",
          sourceId: "src-2",
          sourceName: "Lecture-05-TCP.pdf",
          page: 11,
        },
      ],
      quiz: [
        {
          id: "q-tcp",
          stem: "The third segment of the TCP handshake is typically:",
          options: [
            { id: "a", text: "SYN" },
            { id: "b", text: "FIN" },
            { id: "c", text: "ACK" },
            { id: "d", text: "RST only" },
          ],
          correctOptionId: "c",
          explanation: "Client completes the handshake with an ACK.",
        },
      ],
      quizReady: true,
      position: { x: 260, y: 400 },
    },
    "l-rdt": {
      id: "l-rdt",
      unitId: "u-transport",
      title: "Reliable data transfer",
      estMinutes: 16,
      status: "locked",
      mastery: 0,
      objectives: ["ACKs, sequence numbers, timers"],
      sections: [
        {
          heading: "Building reliability",
          body: "RDT protocols add sequence numbers, ACKs/NAKs, and retransmission timers over an unreliable channel.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 480, y: 400 },
    },
    "l-congestion": {
      id: "l-congestion",
      unitId: "u-transport",
      title: "TCP congestion control",
      estMinutes: 18,
      status: "due",
      mastery: 0.38,
      objectives: [
        "Slow start vs congestion avoidance",
        "React to loss signals",
      ],
      sections: [
        {
          heading: "AIMD intuition",
          body: "TCP probes for bandwidth (slow start / congestion avoidance) and backs off when loss suggests congestion. cwnd and ssthresh structure the phases.",
        },
        {
          heading: "Exam pitfall",
          body: "Timeout-based loss usually triggers a more severe backoff than triple-duplicate ACKs (fast retransmit / fast recovery), depending on the TCP variant.",
        },
      ],
      citations: [
        {
          id: "c9",
          sourceId: "src-1",
          sourceName: "Kurose-Ross-ch3-transport.pdf",
          page: 64,
        },
        {
          id: "c10",
          sourceId: "src-2",
          sourceName: "Lecture-05-TCP.pdf",
          page: 28,
        },
      ],
      quiz: [
        {
          id: "q-cc-1",
          stem: "In classic TCP, triple duplicate ACKs often trigger:",
          options: [
            { id: "a", text: "Application-layer restart only" },
            { id: "b", text: "Fast retransmit" },
            { id: "c", text: "DNS refresh" },
            { id: "d", text: "Switching to UDP" },
          ],
          correctOptionId: "b",
          explanation: "Triple dup ACKs signal a likely single loss → fast retransmit.",
        },
        {
          id: "q-cc-2",
          stem: "Slow start grows cwnd approximately:",
          options: [
            { id: "a", text: "Linearly every RTT from the start" },
            { id: "b", text: "Exponentially each RTT (roughly doubling)" },
            { id: "c", text: "Not at all until timeout" },
            { id: "d", text: "Only when idle" },
          ],
          correctOptionId: "b",
          explanation: "Slow start increases cwnd aggressively (≈ exponential) until ssthresh.",
        },
      ],
      quizReady: true,
      position: { x: 700, y: 400 },
    },
    "l-ip": {
      id: "l-ip",
      unitId: "u-network",
      title: "IP addressing",
      estMinutes: 12,
      status: "locked",
      mastery: 0,
      objectives: ["IPv4 address structure", "CIDR basics"],
      sections: [
        {
          heading: "Addresses",
          body: "IP addresses identify interfaces. CIDR prefixes aggregate routes and define subnets.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 40, y: 580 },
    },
    "l-forward": {
      id: "l-forward",
      unitId: "u-network",
      title: "Forwarding vs routing",
      estMinutes: 12,
      status: "locked",
      mastery: 0,
      objectives: ["Data plane vs control plane"],
      sections: [
        {
          heading: "Two planes",
          body: "Forwarding moves packets using the FIB; routing builds that table via protocols.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 260, y: 580 },
    },
    "l-routing": {
      id: "l-routing",
      unitId: "u-network",
      title: "Routing ideas",
      estMinutes: 14,
      status: "locked",
      mastery: 0,
      objectives: ["Link-state vs distance-vector intuition"],
      sections: [
        {
          heading: "Algorithms",
          body: "Link-state floods topology and runs shortest paths; distance-vector exchanges neighbor estimates.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 480, y: 580 },
    },
    "l-mac": {
      id: "l-mac",
      unitId: "u-link",
      title: "Multiple access",
      estMinutes: 12,
      status: "locked",
      mastery: 0,
      objectives: ["Channel partitioning vs random access"],
      sections: [
        {
          heading: "Sharing the medium",
          body: "Multiple access protocols coordinate who transmits on a shared link — TDMA, CSMA, and others.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 40, y: 760 },
    },
    "l-ethernet": {
      id: "l-ethernet",
      unitId: "u-link",
      title: "Ethernet / MAC",
      estMinutes: 12,
      status: "locked",
      mastery: 0,
      objectives: ["MAC addresses", "CSMA/CD history"],
      sections: [
        {
          heading: "Frames",
          body: "Ethernet frames carry MAC addresses and payloads up to the network layer.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 260, y: 760 },
    },
    "l-switch": {
      id: "l-switch",
      unitId: "u-link",
      title: "Switches",
      estMinutes: 10,
      status: "locked",
      mastery: 0,
      objectives: ["Self-learning switch tables"],
      sections: [
        {
          heading: "Learning bridges",
          body: "Switches learn which MAC addresses sit on which ports and forward or flood accordingly.",
        },
      ],
      citations: [],
      quiz: [],
      quizReady: true,
      position: { x: 480, y: 760 },
    },
  },
};

export function getCourse(id: string): Course | undefined {
  if (id === CN_COURSE_ID) return computerNetworksCourse;
  return undefined;
}

export function listCourses(): Course[] {
  return [computerNetworksCourse];
}

export function getActiveCourse(): Course {
  const courses = listCourses();
  let best = courses[0];
  for (const course of courses) {
    const a = best.lastStudiedAt ?? best.createdAt;
    const b = course.lastStudiedAt ?? course.createdAt;
    if (b > a) {
      best = course;
    }
  }
  return best;
}

export function lessonPackCost(lesson: { estMinutes: number }): number {
  return lesson.estMinutes;
}

export function buildSessionPack(
  course: Course,
  budgetMinutes: number,
): SessionPackItem[] {
  const lessons = Object.values(course.lessons).slice();
  lessons.sort((a, b) => a.estMinutes - b.estMinutes);

  const due: SessionPackItem[] = [];
  const weak: SessionPackItem[] = [];
  const resume: SessionPackItem[] = [];
  const available: SessionPackItem[] = [];

  for (const lesson of lessons) {
    if (lesson.status === "due") {
      due.push({ lessonId: lesson.id, kind: "review" });
    } else if (lesson.status === "weak") {
      weak.push({ lessonId: lesson.id, kind: "weak" });
    } else if (lesson.status === "in_progress") {
      resume.push({ lessonId: lesson.id, kind: "resume" });
    } else if (lesson.status === "available") {
      available.push({ lessonId: lesson.id, kind: "new" });
    }
  }

  const tiers = [due, weak, resume, available];
  const pack: SessionPackItem[] = [];
  const packed = new Set<string>();
  let used = 0;

  for (let pass = 0; pass < 3; pass++) {
    let added = false;
    for (const tier of tiers) {
      for (const item of tier) {
        if (packed.has(item.lessonId)) continue;
        const lesson = course.lessons[item.lessonId];
        if (!lesson || lesson.status === "deferred") continue;
        const cost = lessonPackCost(lesson);
        if (used + cost > budgetMinutes && pack.length > 0) continue;
        pack.push(item);
        packed.add(item.lessonId);
        used += cost;
        added = true;
        if (used >= budgetMinutes) return pack;
      }
    }
    if (!added) break;
  }
  return pack;
}

export function unitForLesson(course: Course, lessonId: string) {
  const lesson = course.lessons[lessonId];
  if (!lesson) return undefined;
  return course.units.find((u) => u.id === lesson.unitId);
}
