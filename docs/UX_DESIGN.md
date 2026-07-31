# GuidedLearning — UX Design Specification

**Status:** v1 draft (pre-implementation)  
**Design language:** [Atlas Noir — DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)  
**Product codename:** GuidedLearning  
**Reference shape:** [Paradigm.study](https://www.paradigm.study/)-like **course structure** (units → lessons on a visual path), not a companion-chat product

---

## 1. Product summary

GuidedLearning turns **textbooks and lecture PDFs** into a **stable course** — **Course → Unit → Lesson** — shown on a **spatial path**. Lessons are studied in focus mode with **RAG-grounded** content and citations. **Quizzes** update **mastery, difficulty, and spaced review**. The path **rewrites priorities** (not the whole tree) as the learner changes.

### 1.1 Goals

| Priority | Goal |
|---|---|
| 1 · AI/ML | Defensible adaptive tutor: graph + scheduler + grounded generation + evals |
| 2 · Backend | Ingest, course graph, attempts, scheduling APIs |
| 3 · Frontend | Excellent, distinctive UX — path atlas + lesson focus as signature |

### 1.2 Non-goals (v1)

- Marketplace of courses, social feed, tuition bargaining  
- Clover-style life-admin companion as core UX  
- Arbitrary perfect tutoring on unconfirmed noisy graphs  
- Mobile-native apps (responsive web only)  
- Real-time multiplayer study  

### 1.3 Primary users

| User | Context | Success |
|---|---|---|
| **You (builder-learner)** | Computer Networks exam prep; textbooks + lecture PDFs; long horizon | Real study habit; spaced review works over weeks |
| **Interviewer / hiring manager** | 3–5 minute walkthrough on *your* real course | Understands adaptive loop; impressed by path + grounding + model update |
| **Future portfolio visitor** | Public demo with sanitized corpus | Completes one lesson + quiz without explanation |

### 1.4 Jobs to be done

1. **Ingest** CN materials and get a trustworthy course map  
2. **Confirm** structure before committing memory/schedule  
3. **Study** in fixed session packs with clear “what now”  
4. **Prove** learning via quizzes that change the path  
5. **Return** days later to *due* reviews, not a cold chatbot  

---

## 2. UX principles

1. **Orientation over chat** — Always know where you are in the course.  
2. **Confirm before memory** — No silent graph that breaks spaced review.  
3. **One primary action per screen** — Usually “Start session” or “Continue lesson.”  
4. **Grounding is part of the UI** — Citations are first-class, not fine print.  
5. **Adaptation is visible** — After a quiz, show *what changed* on the path.  
6. **Map + list dual access** — Spatial wow with linear accessibility fallback.  
7. **Honest AI** — Loading, partial failure, and low-confidence extraction are visible.  
8. **Interview-ready real use** — Default home is *your* live course, not onboarding theater.

---

## 3. Information architecture

### 3.1 Object model (user-facing)

```text
Library
  └── Course (e.g. Computer Networks)
        ├── Sources[] (PDFs)
        ├── Units[]
        │     └── Lessons[]
        │           ├── Content (grounded sections)
        │           ├── Citations[]
        │           ├── Quiz
        │           └── Learning state (mastery, difficulty, next_review, status)
        ├── Diagnostic (optional, on activate)
        └── Session packs (ephemeral plans)
```

### 3.2 App map

```text
/                       Marketing / entry (minimal for portfolio)
/app                    Home — resume active course or course list
/app/courses/new        Upload + create course
/app/courses/:id        Course atlas (path) ← primary home
/app/courses/:id/confirm   Graph confirm editor
/app/courses/:id/diagnostic  Placement quiz
/app/courses/:id/lessons/:lessonId   Lesson focus (teach)
/app/courses/:id/lessons/:lessonId/quiz
/app/courses/:id/session    Active session runner (pack queue)
/app/courses/:id/sources    Source library + parse status
/app/courses/:id/insights   Mastery / schedule / light evals (power + resume)
/app/settings               Account, appearance, motion
```

### 3.3 Primary navigation

**Minimal chrome**

| Region | Contents |
|---|---|
| Top bar | Wordmark · Course switcher · Session pack summary · User |
| Course local nav | Atlas · Sources · Insights · (Confirm if draft) |
| No persistent heavy left nav of 12 items | Avoid “admin template” IA |

---

## 4. Core user flows

### 4.1 Flow A — First course (happy path)

```text
Upload PDFs → Parse/ingest → Draft course graph → Confirm map
→ Activate course → Optional diagnostic → Atlas home → Start session
→ Lesson → Quiz → Path update → Next in pack / End session
```

**Time budget targets**

| Step | Target UX time |
|---|---|
| Upload + see jobs queued | < 30s interaction |
| First draft map ready | Async; progressive UI (skeleton path) |
| Confirm map | 2–10 min first time (worth it) |
| Diagnostic | 3–6 min optional |
| One lesson + quiz | 8–20 min |

### 4.2 Flow B — Return visit (daily driver)

```text
Open app → Land on course atlas → See due/weak highlighted
→ Session pack auto-built → Start → Complete queue → Done summary
```

### 4.3 Flow C — Interview walkthrough (scripted UX)

**Do not build a separate “demo mode.”** Use real product state.

1. Atlas with mid-progress CN course (some mastered, some due)  
2. Point at **Session pack** (“overdue → weak → new”)  
3. Open one **due** lesson — show citations into PDF  
4. Complete quiz — **mastery ring + node state** update on return to atlas  
5. (Optional) Insights: coverage / faithfulness snippet  

**Avoid live PDF upload in interviews** unless asked (latency risk).

### 4.4 Flow D — Partial ingest failure

```text
4 PDFs → 3 OK, 1 fail → Banner: continue with 3 or retry
→ Draft graph from successful sources only → User informed of gaps
```

### 4.5 Flow E — Re-upload / extend course

v1 default: **new sources append as draft delta** requiring confirm; do not silently renumber lesson IDs (protects SRS).  
Simple escape hatch: “Create new course from these files.”

---

## 5. Screen specifications

### 5.1 Home / course list (`/app`)

**Purpose:** Resume learning in one click.

**Layout**

- Hero row: **Continue {Course}** primary card with next session estimate  
- Grid of courses: title, progress ring, due count, last studied  
- Empty: CTA “Create your first course” + short value props (path, quizzes, spaced review)

**States:** empty · loading · one course · many · error  

**Primary action:** Continue active course  

---

### 5.2 Create course — upload (`/app/courses/new`)

**Purpose:** Add textbooks + lecture PDFs.

**UI**

- Large **UploadDropzone** (multi-file, drag/drop, click)  
- Course title field (default from first PDF name, editable)  
- File list: name, size, parse status (`queued | parsing | ready | failed`)  
- Footer: **Build course map** (enabled when ≥1 file ready)

**Copy**

- “PDFs only in v1 · textbooks and lecture slides work best”  
- On fail: “We couldn’t read this file — retry or remove”

**Anti-patterns:** Fake 100% progress bars; blocking whole page on one file  

---

### 5.3 Graph confirm (`/app/courses/:id/confirm`)

**Purpose:** Freeze stable **Unit → Lesson** structure before adaptive memory starts.

**Why this screen exists:** Spaced review needs stable IDs. AI extraction is a draft.

**Layout**

- Left (or main): editable **CourseAtlas** draft (units as clusters, lessons as nodes)  
- Right inspector: selected node title, est. minutes, prereq edges, source anchors  
- Top bar: “Draft · not studying yet” · **Activate course**

**Interactions**

| Action | Behavior |
|---|---|
| Rename unit/lesson | Inline edit |
| Merge lessons | Multi-select → Merge |
| Split (stretch) | “Split lesson” if AI over-chunked — v1.1 if hard |
| Delete | Confirm; may orphan edges (warn) |
| Drag reorder within unit | Updates sequence |
| Move lesson across units | Drag to cluster |
| Auto-layout | Button; doesn’t reset names/IDs |
| Est. minutes | Editable number 5–45 |

**Exit criteria for Activate**

- ≥1 unit, ≥1 lesson  
- All lessons titled  
- No empty units (or auto-remove empty)  
- Confirm modal: “Spaced review will use this structure”

**Primary action:** Activate course  

---

### 5.4 Diagnostic (`/app/courses/:id/diagnostic`)

**Purpose:** Skip or de-prioritize known material.

**UI**

- Short intro: “10–15 questions · places you on the map”  
- One question per view (focus)  
- Progress dots  
- Finish → summary: units skipped / weakened / baseline  

**Skip path:** “Skip diagnostic” always visible (secondary)

**Outcome UX:** Atlas nodes update status; toast “Placement applied”  

---

### 5.5 Course atlas (`/app/courses/:id`) — **signature screen**

**Purpose:** Paradigm-like **course shape** — see the whole path and what to do now.

**Layout (desktop)**

```text
┌──────────────────────────────────────────────────────────┐
│ Top bar · Course title · Atlas | Sources | Insights        │
├──────────────────────────────────────────────────────────┤
│ SessionPackBar: Due 2 · Weak 1 · New 1 · ~28 min [Start] │
├────────────────────────────┬─────────────────────────────┤
│                            │ Inspector (selection)       │
│     CourseAtlas canvas     │ Title, state, mastery       │
│     units + lesson nodes   │ Prerequisites               │
│     pan / zoom             │ Start lesson                │
│                            │ Citations count             │
└────────────────────────────┴─────────────────────────────┘
│ Toggle: Map | List                                        │
└──────────────────────────────────────────────────────────┘
```

**Map behavior**

- Pan / zoom; fit-to-course control  
- Unit clusters labeled  
- Edges = prereq / sequence  
- Click node → inspector; double-click or Start → lesson (if unlocked)  
- Hover: est. time + state  

**List curriculum (required fallback)**

- Grouped by unit  
- Sort: Due first, then weak, then default order  
- Same actions as map  

**SessionPackBar**

- Explains pack composition in plain language  
- Edit duration: 15 / 25 / 45 / 60  
- **Start session** → `/session`  

**Empty/error**

- Draft not activated → CTA to Confirm  
- All mastered + nothing due → “Schedule healthy · browse to review”  

---

### 5.6 Session runner (`/app/courses/:id/session`)

**Purpose:** Execute a fixed-time pack without decision fatigue.

**UI**

- Queue rail: upcoming lessons with type tags (`Review` / `New` / `Weak`)  
- Main: current lesson embed or link-through full lesson route  
- Footer: time estimate remaining · Skip (with reason?) · End session  

**Rules**

- Skip marks “not now” — does not mark mastered  
- Early end → partial progress saved; remainder stays due/available  
- Completion summary: lessons done, quiz scores, mastery deltas, next due date  

---

### 5.7 Lesson focus (`/app/courses/:id/lessons/:lessonId`)

**Purpose:** Teach mode — calm, grounded, 8–20 minutes.

**Layout**

```text
┌─ thin top: Unit / Lesson · mastery · Exit ───────────────┐
│                                                          │
│  Objectives (3 bullets max)                              │
│  ──                                                      │
│  Sections (H2) + body serif                              │
│  CitationChips inline / end of section                   │
│  Callout: key definition                                 │
│                                                          │
│  [Open sources]     [Take quiz →]                        │
└──────────────────────────────────────────────────────────┘
```

**Behaviors**

- Entering lesson sets `in_progress` if not mastered  
- **Open sources** sheet: PDF preview at citation anchors  
- Scroll progress optional (thin bar)  
- **Take quiz** primary after scroll threshold or always available in footer  

**Content states**

| State | UI |
|---|---|
| Generating | Section skeletons + “Grounding in your sources…” |
| Ready | Full content |
| Low grounding | Banner: “Limited source match — treat carefully” |
| Failed | Retry generate; don’t fake content |

**Paper mode:** optional toggle for light reading surface (see design system)

---

### 5.8 Quiz (`.../quiz`)

**Purpose:** Signal for mastery, difficulty, next review.

**Structure**

1. Progress (Q i of n)  
2. Stem  
3. Answers (MCQ radio cards; one short free-response when present)  
4. Submit question → immediate per-item feedback  
5. End → overall score + **What changed** panel  

**What changed panel (critical for adaptive UX)**

- Mastery before → after  
- Next review date/time  
- Difficulty adjustment (learner-facing: “Easier / Same / Harder items next time”)  
- CTA: **Back to path** (animated node update) or **Next in session**

**Rules**

- No blocked “perfect score only” gates by default  
- Fail / low score → offer **Retry** and/or schedule remediation; may re-lock advanced lessons if prereqs break (soft — toast explanation)  
- Free-response: “AI graded with rubric · source-checked” microcopy  

---

### 5.9 Sources (`/app/courses/:id/sources`)

**Purpose:** Trust and debugging for RAG.

- Table/list of PDFs: pages, parse status, last used  
- Click → preview  
- Add more sources → re-enter draft delta confirm if structure changes  

---

### 5.10 Insights (`/app/courses/:id/insights`)

**Purpose:** Learner utility + resume AI story.

**Sections**

1. **Mastery by unit** — simple bars  
2. **Schedule health** — due load next 7 days  
3. **Model / eval (honest)** — coverage of sources, recent faithfulness sampling (not fake 99.9%)  

Keep charts minimal; this is not an analytics SaaS.

---

### 5.11 Settings

- Display: motion on/off, paper lesson default  
- Session defaults: 25 min  
- Account (if auth): email, logout  
- Danger: delete course  

---

## 6. Adaptive UX (visible behavior)

### 6.1 Status machine (lesson)

```text
locked → available → in_progress → (due | weak | mastered)
              ↑                           │
              └──── remediation / fail ───┘
```

### 6.2 Packer (session composition)

**Priority:** due reviews → weak → in_progress resume → new available (prereqs met)

**Constraints**

- Sum of `est_minutes` (+ quiz buffer ~3–5 min/lesson) ≤ session budget  
- Prefer completing whole lessons over tiny fragments  
- Show user-readable recipe: “2 due · 1 weak · 1 new”

### 6.3 Path rewrite (what the user sees)

- Tree structure stable after confirm  
- **Changes:** node status, badges, recommended order, connector emphasis, session pack  
- Animate on return from quiz (design system choreography)

### 6.4 Difficulty (learner-facing)

Do not expose raw Elo numbers unless Insights advanced toggle.

Use: “Question difficulty adjusting to your performance.”

---

## 7. Feedback, empty, error patterns

| Situation | Pattern |
|---|---|
| Global loading | Route-level skeleton matching layout |
| Inline save | Silent debounce + subtle saved check |
| Destructive | Modal confirm |
| AI long job | Job list with cancel if possible; leave page freely |
| Offline | Banner; disable generate/quiz submit |
| Permission / auth | Redirect to sign-in with return URL |
| 404 lesson | “Lesson missing · back to atlas” |

**Empty states must include:** title, one sentence, primary CTA, optional secondary.

---

## 8. Responsive UX

| Viewport | Atlas | Lesson | Quiz |
|---|---|---|---|
| ≥1024 | Map + inspector | Centered reader | Full focus |
| 768–1023 | Map; inspector as sheet | Reader | Focus |
| <768 | **List default**; map optional simplified | Full width reader | Full width |

Touch: node hit targets ≥44px; pack bar sticky bottom CTA on mobile.

---

## 9. Accessibility UX requirements

- Map is **enhancement**; List is full peer  
- All states announced (see design system node name pattern)  
- Quiz: roving focus on options; result in `aria-live="polite"`  
- Focus trap in modals and sheets  
- No keyboard trap on canvas (Esc clears selection; Tab exits to chrome)  
- Captions not required (no essential audio in v1)

---

## 10. Content design — Computer Networks v1

### 10.1 Example course skeleton (illustrative)

| Unit | Example lessons |
|---|---|
| Introduction & edge | What is the Internet; Delay, loss, throughput; Protocol layers |
| Application | HTTP; DNS; SMTP/IMAP overview |
| Transport | UDP; TCP basics; Reliable data transfer; Congestion control |
| Network | IP addressing; Forwarding vs routing; Routing ideas |
| Link | Multiple access; Ethernet/MAC; Switches |

Real graph comes from user PDFs + confirm step.

### 10.2 Lesson content template

1. **Title**  
2. **Objectives** (2–4)  
3. **Core explanation** (grounded)  
4. **Worked example or diagram description**  
5. **Common exam pitfall**  
6. **Citations**  
7. **Quiz** (3–8 items)

---

## 11. Microcopy catalog (selected)

| Location | Copy |
|---|---|
| Pack bar | “Today’s pack · ~25 min · 2 due · 1 new” |
| Confirm | “Edit until this matches how you want to study. You can still add sources later.” |
| Activate | “Activate course and start tracking mastery?” |
| Generating lesson | “Writing from your sources…” |
| Low grounding | “Few source matches — double-check against your PDF.” |
| Quiz pass | “Mastery up · review scheduled for {date}” |
| Quiz fail | “Kept this lesson in your weak queue” |
| All clear | “Nothing due · you’re clear for today” |

---

## 12. Metrics (product UX signals)

Instrument later; design for:

| Event | Why |
|---|---|
| `course_activated` | Onboarding completion |
| `session_started` / `session_completed` | Habit loop |
| `lesson_completed` / `quiz_submitted` | Core value |
| `path_state_changed` | Adaptive proof |
| `confirm_edits_count` | Graph AI quality proxy |
| `citation_opened` | Grounding engagement |

---

## 13. Signature moments (portfolio quality bar)

These four moments must feel intentional and polished:

1. **Atlas first paint** — living path with state legend  
2. **Lesson enter** — world quiets; book mode  
3. **Citation open** — PDF proof in one click  
4. **Post-quiz return** — node mastery/due update you can *see*

If only one surface is extraordinary, it is the **Course atlas**.

---

## 14. Phased UX delivery

| Phase | UX ships |
|---|---|
| **P0** | Upload → confirm → atlas (map+list) → lesson → quiz → state update |
| **P1** | Session packer, diagnostic, sources preview, due emphasis |
| **P2** | Insights/evals UI, paper mode, command palette, append sources delta |
| **P3** | Polish motion, mobile map quality, onboarding marketing page |

---

## 15. Open UX decisions (defaults locked)

| Topic | Default for v1 |
|---|---|
| Auth | Simple email/OAuth later; local single-user OK for private alpha |
| Paper lesson mode | Optional toggle; dark default |
| Free-response grading UX | Show score + short rationale + citation if used |
| Remediation lessons | Soft queue first; hard re-lock only if prereq score collapses |
| Public vs private corpus | Personal CN PDFs private; public deploy uses sanitized set |

---

## 16. Acceptance criteria (UX)

v1 UX is “done enough” when:

- [ ] User can go from PDFs to activated course without docs  
- [ ] Atlas communicates state at a glance in <3 seconds  
- [ ] List curriculum is fully usable without the map  
- [ ] Lesson shows ≥1 citation when sources support it  
- [ ] Quiz result changes visible lesson state on atlas  
- [ ] Session pack can be started with one click from atlas  
- [ ] Interview walkthrough fits in 5 minutes on real data  
- [ ] UI matches Atlas Noir (not a generic kit look)

---

## 17. Document control

| Version | Date | Notes |
|---|---|---|
| 0.1 | 2026-07-31 | Initial UX spec from product grill + Atlas Noir |

**Companion:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

*End of UX_DESIGN.md*
