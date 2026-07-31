# GuidedLearning Design System — Atlas Noir

**Status:** v1 draft (pre-implementation)  
**Codename:** Atlas Noir  
**Product:** AI guided learning — upload sources → course path (units → lessons) → adaptive study  
**Related:** [UX_DESIGN.md](./UX_DESIGN.md)

---

## 1. Intent

Atlas Noir is a **product design language**, not a third-party kit skin.

It borrows *discipline* from Linear, *reading calm* from Notion, and *restraint* from Vercel — applied to a **spatial course atlas** and **focus-mode lessons**. It must not read as stock shadcn, Material, generic “AI purple SaaS,” or an iOS clone.

### 1.1 Design pillars

| Pillar | Meaning |
|---|---|
| **Path is the product** | The course map is the primary emotional and navigational surface |
| **State before style** | Learning states are always legible without relying on color alone |
| **Lesson is a book** | Teach mode is calm, typographic, citation-honest |
| **Chrome is air** | App chrome recedes; content and path carry identity |
| **Motion explains the model** | Animation shows mastery, due pressure, and path rewrite — never decoration alone |
| **One accent family** | A single signal hue; semantics do the rest |
| **No kit aesthetic** | Custom components and tokens; headless primitives only for behavior if needed |

### 1.2 Reference map (steal / don’t steal)

| Reference | Steal | Don’t steal |
|---|---|---|
| Linear | Density, state craft, keyboard feel, quiet accent | Issue-tracker IA |
| Notion | Document lesson hierarchy, block rhythm | Grey mush, toy clutter |
| Vercel / Geist | Black/white backbone, mono meta, zero fluff | Deploy-dashboard marketing |
| Apple HIG | Focus mode, weighted motion, content over chrome | SF-everywhere iOS clone |
| Paradigm.study | Units/lessons on a spatial path | Companion mascot, marketplace, tuition |

---

## 2. Brand voice (UI copy)

| Attribute | Do | Don’t |
|---|---|---|
| Tone | Calm, precise, coach-like | Hype, “crush it 🚀”, condescension |
| Density | Short labels; one line of help max | Paragraphs in tooltips by default |
| AI honesty | “Grounded in your PDF p.42” | “I dreamed up an explanation” without sources |
| Errors | Human + recoverable action | Stack traces in the main UI |
| Empty states | Tell the next step | Cute void with no CTA |

**Examples**

- “3 lessons due · 25 min packed”
- “Confirm your course map before studying”
- “Weak on TCP congestion — scheduled for review”
- “Couldn’t parse 1 of 4 PDFs — retry or skip”

---

## 3. Color

### 3.1 Foundations (dark-first)

| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#07070A` | App background |
| `canvas-elevated` | `#0C0C12` | Path stage wash |
| `surface-0` | `#0E0E14` | Base panels |
| `surface-1` | `#14141C` | Cards, nodes at rest |
| `surface-2` | `#1A1A24` | Hover / raised |
| `surface-3` | `#22222E` | Active / selected shell |
| `hairline` | `rgba(255,255,255,0.08)` | Borders, dividers |
| `hairline-strong` | `rgba(255,255,255,0.14)` | Focus rings (non-accent) |
| `text-primary` | `#F4F4F5` | Headings, primary body |
| `text-secondary` | `#A1A1AA` | Meta, secondary |
| `text-tertiary` | `#71717A` | Disabled, hints |
| `text-invert` | `#09090B` | On solid accent fills |

### 3.2 Brand accent (signal teal)

Single accent family — **teal**, not violet-and-teal together.

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#2DD4BF` | Primary actions, available emphasis, links in chrome |
| `accent-muted` | `rgba(45, 212, 191, 0.16)` | Chips, soft fills |
| `accent-hover` | `#5EEAD4` | Hover on accent |
| `accent-press` | `#14B8A6` | Active |
| `accent-ring` | `rgba(45, 212, 191, 0.45)` | Focus rings on interactive controls |

### 3.3 Semantic learning states

Never encode state with color alone — always **label + icon/shape + color**.

| State | Token | Color | Shape / mark |
|---|---|---|---|
| `locked` | `state-locked` | `#52525B` | Padlock / dashed node border |
| `available` | `state-available` | `#2DD4BF` | Solid node, open path |
| `in_progress` | `state-progress` | `#38BDF8` | Partial ring |
| `due` | `state-due` | `#FBBF24` | Pulse dot / bold badge “Due” |
| `weak` | `state-weak` | `#FB7185` | Warning tick on node |
| `mastered` | `state-mastered` | `#34D399` | Check / filled calm node |
| `remediation` | `state-remediation` | `#C084FC` | Branch marker (sparse use) |

### 3.4 Feedback

| Token | Hex | Usage |
|---|---|---|
| `success` | `#34D399` | Quiz pass, save OK |
| `warning` | `#FBBF24` | Due, partial parse |
| `danger` | `#F87171` | Destructive, hard fail |
| `info` | `#38BDF8` | Neutral system info |

### 3.5 Light lesson surface (optional shell)

Lesson **reading surface** may flip to paper for long sessions; path shell stays dark.

| Token | Hex |
|---|---|
| `paper` | `#F7F6F2` |
| `paper-ink` | `#18181B` |
| `paper-muted` | `#52525B` |
| `paper-line` | `rgba(24,24,27,0.08)` |
| `paper-accent` | `#0F766E` (darker teal for contrast on paper) |

### 3.6 Gradients & effects (strict)

- **Allowed:** single soft radial wash behind path canvas (`accent` at ≤6% opacity).  
- **Banned:** rainbow meshes, purple–pink AI gradients, glass blur on scrolling content, neon glow on every card.

---

## 4. Typography

### 4.1 Families

| Role | Family | Fallback stack |
|---|---|---|
| UI / path | **Geist Sans** or **Satoshi** | `ui-sans-serif, system-ui, sans-serif` |
| Lesson body | **Source Serif 4** or **Literata** | `ui-serif, Georgia, serif` |
| Meta / citations / IDs | **Geist Mono** | `ui-monospace, SFMono-Regular, monospace` |

Do **not** use Inter as the brand face. One UI sans + one lesson serif + one mono is the max.

### 4.2 Scale (rem @ 16px root)

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `display` | 2.5rem (40px) | 1.15 | 600 | Rare marketing / empty hero |
| `title-lg` | 1.75rem (28px) | 1.25 | 600 | Course title on path |
| `title-md` | 1.375rem (22px) | 1.3 | 600 | Unit title, lesson H1 |
| `title-sm` | 1.125rem (18px) | 1.35 | 600 | Section heads |
| `body-lg` | 1.125rem (18px) | 1.65 | 400 | Lesson paragraphs |
| `body` | 0.9375rem (15px) | 1.5 | 400 | App UI body |
| `body-sm` | 0.8125rem (13px) | 1.45 | 400 | Meta, secondary |
| `caption` | 0.75rem (12px) | 1.4 | 500 | Badges, timestamps |
| `micro` | 0.6875rem (11px) | 1.3 | 500 | Uppercase eyebrows (`tracking-wide`) |
| `mono` | 0.75–0.8125rem | 1.4 | 400 | Citations, scores, node IDs |

### 4.3 Lesson measure

- Optimal line length: **65–75 characters**  
- Max content column: **42rem**  
- Lesson H1 stays in content column; no full-bleed titles over path chrome

### 4.4 Typographic rules

- UI labels: sentence case (not Title Case Everywhere)  
- Eyebrow chips: uppercase + `letter-spacing: 0.08em` sparingly  
- Never center long lesson body text  
- Quiz stems use `title-sm` / `body-lg`; options use `body`

---

## 5. Layout & spacing

### 5.1 Grid

- Base unit: **4px**  
- Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

### 5.2 Density modes

| Mode | Where | Gutter / padding |
|---|---|---|
| **Atlas** (path) | Course map | Generous stage padding `24–40`; nodes breathe |
| **Workbench** | Graph confirm, upload, settings | Linear-like `16–24` |
| **Focus** | Lesson + quiz | Content column centered; side rails collapse |

### 5.3 Radii

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Chips, inputs |
| `radius-md` | 10px | Buttons, small cards |
| `radius-lg` | 16px | Panels, lesson sheets |
| `radius-xl` | 24px | Path stage, major shells |
| `radius-full` | 9999px | Pills, mastery dots |

Prefer **soft squircle feel** via large radii on major shells; avoid perfect iOS continuous-corner cosplay.

### 5.4 Elevation

No heavy Material shadows.

| Level | Treatment |
|---|---|
| 0 | Flat on canvas |
| 1 | `hairline` border + optional `0 1px 0 rgba(255,255,255,0.04)` inset highlight |
| 2 | Soft ambient: `0 12px 40px rgba(0,0,0,0.45)` + hairline (modals, floating packs) |
| Node | State ring (2px) rather than drop shadow for status |

### 5.5 Breakpoints

| Token | Width | Behavior |
|---|---|---|
| `sm` | 640px | Single column; path simplified |
| `md` | 768px | Lesson dual-pane optional |
| `lg` | 1024px | Path + side inspector |
| `xl` | 1280px | Full atlas stage |
| `2xl` | 1536px | Max stage width ~1440 content |

---

## 6. Iconography & imagery

- Style: **light stroke**, 1.5px optical, consistent set (Phosphor Light or Remix Line)  
- Sizes: 16 / 20 / 24  
- State icons must pair with text labels in lists; map nodes may use icon-only **with** aria-label  
- Illustrations: sparse line diagrams for empty states (networks motif OK if abstract)  
- No 3D robot mascots, no stock “students with laptops” photos in v1 app chrome

---

## 7. Motion

### 7.1 Principles

1. Motion **answers a question**: What changed in my path / mastery?  
2. Prefer `transform` + `opacity` only  
3. Respect `prefers-reduced-motion: reduce` → instant state swap, no path physics

### 7.2 Easing & duration

| Token | Value | Use |
|---|---|---|
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Panels, lesson enter |
| `ease-out-soft` | `cubic-bezier(0.32, 0.72, 0, 1)` | Nodes, buttons |
| `duration-instant` | 100ms | Hover color |
| `duration-fast` | 180ms | Chips, toggles |
| `duration-med` | 320ms | Panels, lesson sheet |
| `duration-slow` | 520ms | Path rewrite, mastery settle |
| `duration-path` | 700–900ms | Multi-node layout animation |

### 7.3 Signature choreographies

| Event | Motion |
|---|---|
| Enter lesson | Path dims (opacity); lesson sheet rises `translateY(12→0)` + fade |
| Exit lesson | Reverse; focused node brief accent ring |
| Quiz graded | Option flash success/danger; mastery ring animates to new % |
| Path rewrite | Nodes tween position; new “Up next” draws connector stroke |
| Due appears | Amber badge scale-in; optional gentle node breath (loop ≤2s, subtle) |
| Session pack | Pack bar fills; listed lessons stagger-in 40ms apart |

### 7.4 Banned motion

- Confetti / emoji rain on correct answers  
- Bounce easings on large surfaces  
- Continuous parallax on the map  
- Layout thrash (`top`/`left`/`height` animations)

---

## 8. Component inventory

Custom visual system. Headless behavior (focus trap, menu, dialog) may use primitives **under the hood** without shipping a recognizable kit look.

### 8.1 Foundations

| Component | Spec highlights |
|---|---|
| **Button** | Primary (accent fill), Secondary (hairline), Ghost, Danger. Height 36/40. Pill for CTAs in path HUD; `radius-md` in forms |
| **IconButton** | 36² min hit target; tooltip on desktop |
| **Input / Textarea** | `surface-1`, hairline; focus = accent ring 2px |
| **Select / Combobox** | Same surface language; list in elevated surface-2 |
| **Checkbox / Radio** | Custom marks; accent when selected |
| **Switch** | For settings only |
| **Tabs** | Underline style (Vercel-quiet), not chunky pills for primary nav |
| **Toast** | Bottom-center or bottom-right; one line + optional action |
| **Modal / Dialog** | `radius-xl`, level-2 elevation, dim canvas 60% |
| **Sheet** | Right or bottom for inspectors / mobile lesson meta |
| **Tooltip** | 0.2s delay; never the only place for critical info |
| **Dropdown menu** | Compact Linear density |
| **Skeleton** | Soft pulse on `surface-2`; path uses node-shaped skeletons |

### 8.2 Product components

| Component | Purpose |
|---|---|
| **AppShell** | Minimal top bar + optional left rail; path gets max canvas |
| **CourseAtlas** | Zoomable/pannable stage for units & lessons |
| **UnitCluster** | Group hull around lesson nodes |
| **LessonNode** | State ring, title, est. minutes, due badge |
| **PathConnector** | Prereq edges; muted when locked path |
| **SessionPackBar** | “Today · 25m · 4 lessons” + Start |
| **MasteryRing** | 0–100 micro chart on node or header |
| **StateBadge** | Locked / Due / Mastered / Weak |
| **CitationChip** | `source.pdf · p.12` mono; click → source preview |
| **SourcePreview** | PDF page snippet or highlight pane |
| **LessonReader** | Serif body, objectives, sections, citations |
| **QuizPanel** | Stem, options, submit, feedback, continue |
| **DiagnosticBanner** | Short placement quiz entry |
| **GraphConfirmCanvas** | Edit units/lessons before activate (merge/rename/delete) |
| **UploadDropzone** | Multi-PDF; per-file parse status |
| **ParseJobList** | Pipeline progress for ingest |
| **CoverageMeter** | Eval/curriculum coverage (portfolio + power user) |
| **EmptyState** | Illustration slot + title + primary action |
| **CommandPalette** (stretch) | ⌘K jump to lesson / unit |

### 8.3 Button hierarchy rules

- **One** primary button per view  
- Destructive always secondary-positioned + confirm  
- On path HUD: **Start session** is the primary forever until session ends  

### 8.4 Node visual spec (LessonNode)

```
┌─────────────────────────┐
│  ○ mastery   12 min     │
│  Transport · Congestion │
│  [Due]                  │
└─────────────────────────┘
```

- Width ~180–220px desktop; compact on zoom-out (title + state only)  
- Border = state color at 40–100% intensity  
- Selected = accent ring + `surface-2`  
- Locked = 50% opacity labels + dashed border  

---

## 9. Semantic state matrix (UI contract)

| State | Node | List row | Allowed actions |
|---|---|---|---|
| locked | Dashed, dim | Lock icon | View prereqs only |
| available | Accent border | “Available” | Start lesson |
| in_progress | Blue partial ring | Progress % | Resume |
| due | Amber badge + breath | “Due” sort-first | Start review |
| weak | Rose tick | “Weak” | Remediation lesson |
| mastered | Green calm | Check | Review anytime |
| remediation | Violet branch | “Review path” | Start remediation |

**Up next** algorithm display order (visual packer):  
`due → weak → in_progress → available (prereqs met) → mastered (low priority)`

---

## 10. Accessibility

| Requirement | Standard |
|---|---|
| Contrast | WCAG 2.2 AA minimum on text and essential state indicators |
| Focus | Visible `accent-ring`; never `outline: none` without replacement |
| Keyboard | Full path: tab to nodes or list fallback; lesson + quiz fully operable |
| Hit targets | ≥24px (prefer 36px) for controls; nodes large enough on touch |
| Color | State label or icon always present |
| Motion | Honor `prefers-reduced-motion` |
| Semantics | Landmarks: `nav`, `main`, lesson `article`; live region for quiz result |
| Graph fallback | **List curriculum** view equivalent to map for SR / reduced-motion / mobile |

Screen reader node name example:  
“Lesson: TCP congestion control, due, estimated 12 minutes, mastery 40 percent.”

---

## 11. Content & data ranges (for layout stress)

| Element | Min | Typical | Max (UI must survive) |
|---|---|---|---|
| Course title | 8 chars | 24 | 80 |
| Unit title | 6 | 20 | 60 |
| Lesson title | 8 | 28 | 90 |
| Units / course | 1 | 5–8 | 20 |
| Lessons / unit | 1 | 4–8 | 30 |
| Lessons / course | 5 | 30–60 | 200 (map clustering required) |
| Est. minutes | 5 | 12 | 45 |
| Quiz options | 2 | 4 | 6 |
| Citations / lesson | 0 | 2–5 | 20 |
| PDF filename | short | medium | 120 chars (truncate mid) |

---

## 12. Do / Don’t

### Do

- Dark atlas + optional paper lesson  
- One accent (teal)  
- Show citations inline as chips  
- Animate mastery and path changes  
- Provide list curriculum alongside map  
- Keep empty states actionable  

### Don’t

- Ship default shadcn/New York zinc look  
- Use Inter + purple gradient + glass cards as identity  
- Hide learning state in color-only dots  
- Auto-play noisy motion  
- Put marketing bento grids inside the study app  
- Add a cartoon tutor as brand center in v1  

---

## 13. Token delivery (implementation note)

Recommended shape when code starts:

```text
tokens/
  color.css          /* CSS variables */
  typography.css
  space.css
  motion.css
  semantic-states.css
```

Framework-agnostic CSS variables first; map into Tailwind theme **only as a thin adapter**, not as the source of identity.

---

## 14. Versioning

| Version | Notes |
|---|---|
| **0.1** | This document — Atlas Noir locked for UX + implementation |
| **0.2** | After first UI implementation — add screenshots + component gallery |
| **1.0** | Portfolio demo-ready consistency pass |

---

## 15. Open implementation choices (non-blocking)

These do **not** change the language:

- Exact font files (Geist vs Satoshi; Source Serif 4 vs Literata)  
- Graph library (e.g. xyflow) vs custom canvas — behavior must match UX_DESIGN  
- Whether paper lesson mode ships in v1 or v1.1  

---

*End of DESIGN_SYSTEM.md*
