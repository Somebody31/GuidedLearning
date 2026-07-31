-- GuidedLearning Postgres + pgvector schema (Phase B1+)
-- Apply after: CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;

-- Pin embedding dim when Qwen3 size is chosen, e.g. vector(4096)
-- ALTER after first measured dim from embedTexts(["ping"])[0].length

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('draft', 'draft_saved', 'activated')),
  session_default_minutes INT NOT NULL DEFAULT 25,
  last_studied_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  graph_version INT NOT NULL DEFAULT 0,
  embedding_model TEXT,
  embedding_dims INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  bytes BIGINT,
  pages INT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'parsing', 'ready', 'failed')),
  error TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_pages (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  page_num INT NOT NULL,
  text TEXT NOT NULL,
  UNIQUE (source_id, page_num)
);

-- embedding column type set when dims known:
-- embedding vector(N)
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  page_start INT NOT NULL,
  page_end INT NOT NULL,
  text TEXT NOT NULL,
  token_count INT,
  embedding vector
  -- CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops);
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  est_minutes INT NOT NULL DEFAULT 10,
  sort_order INT NOT NULL DEFAULT 0,
  position_x DOUBLE PRECISION,
  position_y DOUBLE PRECISION,
  objectives JSONB NOT NULL DEFAULT '[]',
  sections JSONB NOT NULL DEFAULT '[]',
  citations JSONB NOT NULL DEFAULT '[]',
  quiz JSONB NOT NULL DEFAULT '[]',
  quiz_ready BOOLEAN NOT NULL DEFAULT false,
  content_version INT NOT NULL DEFAULT 0,
  ids_frozen BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS lesson_state (
  lesson_id TEXT PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  mastery DOUBLE PRECISION NOT NULL DEFAULT 0,
  difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  pack_priority INT NOT NULL DEFAULT 0,
  deferred_until TIMESTAMPTZ,
  attempts_in_session INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id TEXT,
  session_id TEXT,
  attempt_index INT NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  answers JSONB NOT NULL,
  mastery_before DOUBLE PRECISION,
  mastery_after DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  budget_minutes INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  pack JSONB NOT NULL,
  skips INT NOT NULL DEFAULT 0,
  deferred_ids JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  source_id TEXT,
  status TEXT NOT NULL,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  payload JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eval_samples (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  chunk_id TEXT,
  faithful BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sources_course ON sources(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_state_status ON lesson_state(status);
CREATE INDEX IF NOT EXISTS idx_jobs_course ON jobs(course_id, status);
