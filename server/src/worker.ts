/**
 * Job worker stub (Phase B1+).
 * Polls Postgres jobs table / memory queue and runs parse → embed → generate.
 * Run: bun run worker
 */
import { env } from "./env";
import { LLM, EMBEDDING } from "./llm/models";

console.log(
  [
    "GuidedLearning worker (stub)",
    `store=${env.DATA_STORE}`,
    `llm=${LLM.model}`,
    `embed=${EMBEDDING.model}`,
    "No job loop yet — implement in B1 (parse_source) / B2 (draft_graph).",
  ].join(" · "),
);

// Keep process alive for future polling loop
setInterval(() => {
  /* idle */
}, 60_000);
