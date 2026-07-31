/**
 * Optional separate worker process. API also runs jobs in-process via kickJobs().
 * Run: bun run worker
 */
import { env } from "./env";
import { llmMode } from "./llm/client";
import { embeddingMode } from "./embed/qwen";
import { kickJobs } from "./jobs/runner";

console.log(
  `GuidedLearning worker · AI=${llmMode()}/${embeddingMode()} · USE_LIVE_AI=${env.USE_LIVE_AI}`,
);

setInterval(() => {
  kickJobs();
}, 2000);

kickJobs();
