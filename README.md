# GuidedLearning

AI-guided learning platform: upload textbooks and lecture PDFs → build a **Course → Unit → Lesson** path → study with grounded lessons, quizzes, and adaptive spaced review.

## Quick start — UI

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — demo course atlas at `/app/courses/cn-kurose`.

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
| LLM | DeepSeek V4 Flash (`deepseek-v4-flash`) |
| Embeddings | Qwen3 Embedding |
| Store (now) | In-memory + local uploads (`cn-kurose` seed) |
| Store (next) | Postgres + pgvector · S3 for PDFs |

**Offline by default:** `USE_LIVE_AI=false` in `server/.env` — full pipeline uses mock embed/LLM so demos cost **zero** API credits. Set `USE_LIVE_AI=true` and keys only when you want live generation. Optional `AUTH_TOKEN` enables Bearer auth.

## Status

- **UI:** P0–P1 mock surfaces (library, upload, confirm, atlas, lesson, quiz, session, sources, insights, settings, diagnostic, light/dark).
- **API:** B0–B5 offline pipeline — upload/parse/chunk, draft graph, activate, mock lessons/quizzes, quiz attempts + SRS, sessions, diagnostic, insights. Live AI gated behind `USE_LIVE_AI`.

Design specs stay **local** under `docs/` (gitignores all `.md` except this README).
