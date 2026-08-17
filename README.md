# GuidedLearning

AI-guided learning platform: upload textbooks and lecture PDFs → build a **Course → Unit → Lesson** path → study with grounded lessons, quizzes, and adaptive spaced review.

## Quick start — UI

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — start a course from any PDFs, or open the sample at `/app/courses/cn-kurose`.

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
| Store (now) | In-memory + local uploads (optional `cn-kurose` sample) |
| Store (next) | Postgres + pgvector · S3 for PDFs |

**Offline by default:** `USE_LIVE_AI=false` in `server/.env` — full pipeline uses mock embed/LLM so demos cost **zero** API credits. Set `USE_LIVE_AI=true` and keys only when you want live generation. Optional `AUTH_TOKEN` enables Bearer auth.

## Status

- **UI:** talks to the API — any subject from PDFs (library, upload, confirm, atlas, lesson, quiz, session, sources, insights, settings, diagnostic).
- **API:** upload/parse/chunk, draft graph, activate, lessons/quizzes, quiz attempts + SRS, sessions, diagnostic, insights. Live AI gated behind `USE_LIVE_AI`. Sample course `cn-kurose` is one seeded demo, not the product.

Design specs stay **local** under `docs/` (gitignores all `.md` except this README).
