# GuidedLearning

AI-guided learning platform: upload textbooks and lecture PDFs, or a folder of code → build a **Course → Unit → Lesson** path → study with grounded lessons, quizzes, and adaptive spaced review.

## Quick start — UI

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — start a course from PDFs or a code folder, or open the sample at `/app/courses/cn-kurose`.

## Quick start — API (Bun + Hono)

```bash
cd server
cp .env.example .env
bun install
bun run dev
```

| Endpoint | |
|---|---|
| Health | http://localhost:8787/health |
| Courses | http://localhost:8787/v1/courses |
| Demo course | http://localhost:8787/v1/courses/cn-kurose |
| Session pack | http://localhost:8787/v1/courses/cn-kurose/session-pack?budget=25 |

```bash
cd server && bun test
```

### Stack (backend)

| Layer | Choice |
|---|---|
| Runtime | Bun |
| HTTP | Hono |
| LLM | DeepSeek V4 Flash, or a local CLI already on PATH (`grok`, `pi`, `opencode`) |
| Embeddings | Qwen3 Embedding |
| Store | JSON file under `server/data/` (`DATA_STORE=file`) + local uploads. Sample course `cn-kurose` is always seeded. |

**Offline by default:** `USE_LIVE_AI=false` in `server/.env` — full pipeline uses mock embed/LLM so demos cost **zero** API credits. Set `USE_LIVE_AI=true` to auto-pick DeepSeek (if `DEEPSEEK_API_KEY` is set) or the first ready local agent. In Settings you can pin `grok`, `pi`, or `opencode` even without a GuidedLearning key — those CLIs use their own login or a free hosted model. Optional `AUTH_TOKEN` enables Bearer auth.

**Code courses:** New course → Code, then upload a folder, a `.zip`, or (when `ALLOW_LOCAL_PATH=true`) paste a path under your home directory. Caps: 200 files, 256KB each, 20MB total. Ignored: `node_modules`, `.git`, lockfiles, and similar.

The website proxies `/v1` and `/health` to the API. Do **not** set `NEXT_PUBLIC_API_URL` in production — the browser should call same-origin `/v1`. Point Next at the API with `API_URL` (default `http://127.0.0.1:8787`).

## Production

```bash
# API — persists courses to server/data/store.json
cd server
# DATA_STORE=file  CORS_ORIGIN=https://your-app.example
bun run start

# Website
cd web
# API_URL=http://127.0.0.1:8787
npm run build && npm start
```

Set `CORS_ORIGIN` to the website origin (comma-separated if you still hit the API cross-origin). Keep `DATA_STORE=file` so a restart does not wipe courses.

## Status

- **UI:** talks to the API — any subject from PDFs or a code folder (desk, upload, confirm path, today, lesson, quiz, sitting, sources, progress, settings, optional placement).
- **API:** upload/parse/chunk, draft graph, activate, lessons/quizzes, quiz attempts + SRS, sessions, diagnostic, insights. Live AI gated behind `USE_LIVE_AI` or an explicit backend in Settings. Sample course `cn-kurose` is one seeded demo, not the product.

Design specs stay **local** under `docs/` (gitignores all `.md` except this README).
