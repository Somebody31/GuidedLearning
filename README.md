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
| LLM | DeepSeek V4 Flash 0731 |
| Embeddings | Qwen3 Embedding |
| Store (now) | In-memory seed (`cn-kurose`) |
| Store (next) | Postgres + pgvector · S3 for PDFs |

Set `DEEPSEEK_API_KEY` and embedding credentials in `server/.env` when wiring generation (Phase B2+). Optional `AUTH_TOKEN` enables Bearer auth.

## Status

- **UI:** P0–P1 mock surfaces (library, upload, confirm, atlas, lesson, quiz, session, sources, insights, settings, diagnostic, light/dark).
- **API:** B0 scaffold live — health, course CRUD list/get, session pack, lesson/quiz read, packer tests. Upload/RAG/LLM jobs next.

Design specs stay **local** under `docs/` (gitignores all `.md` except this README).
