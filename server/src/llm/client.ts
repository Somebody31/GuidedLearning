// One door for lesson/quiz generation. DeepSeek or a local CLI.

import { env } from "../env";
import {
  canSpendLiveCall,
  liveBudgetExhaustedMessage,
  recordLiveCall,
} from "./budget";
import { deepseekComplete } from "./backends/deepseek";
import { grokComplete } from "./backends/grok";
import { opencodeComplete } from "./backends/opencode";
import { piComplete } from "./backends/pi";
import type { ChatMessage } from "./messages";
import { liveLlmEnabled, resolveBackend } from "./resolve";

export type { ChatMessage };

export async function chatCompletion(opts: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
  maxTokens?: number;
}): Promise<string> {
  if (!liveLlmEnabled()) {
    throw new Error(
      "Live LLM disabled (no ready backend). Use mock generators.",
    );
  }
  if (!canSpendLiveCall()) {
    throw new Error(liveBudgetExhaustedMessage());
  }

  const maxTokens = opts.maxTokens ?? env.LIVE_AI_MAX_OUTPUT_TOKENS;
  const backend = resolveBackend();

  let promptChars = 0;
  for (const message of opts.messages) {
    promptChars += message.content.length;
  }

  let content: string;
  if (backend === "grok") {
    content = await grokComplete(opts);
  } else if (backend === "pi") {
    content = await piComplete(opts);
  } else if (backend === "opencode") {
    content = await opencodeComplete(opts);
  } else if (backend === "deepseek") {
    content = await deepseekComplete({ ...opts, maxTokens });
  } else {
    throw new Error("Live LLM disabled. Use mock generators.");
  }

  recordLiveCall({
    promptChars,
    completionChars: content.length,
  });

  return content;
}

export function llmMode(): "mock" | "live" {
  return liveLlmEnabled() ? "live" : "mock";
}

export { liveLlmEnabled, resolveBackend };
