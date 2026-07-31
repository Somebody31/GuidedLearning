import { env, liveLlmEnabled } from "../env";
import {
  canSpendLiveCall,
  liveBudgetExhaustedMessage,
  recordLiveCall,
} from "./budget";
import { LLM } from "./models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * DeepSeek chat — only when USE_LIVE_AI=true and DEEPSEEK_API_KEY set.
 * Always sends max_tokens; refuses if process call budget is spent.
 */
export async function chatCompletion(opts: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
  maxTokens?: number;
}): Promise<string> {
  if (!liveLlmEnabled()) {
    throw new Error(
      "Live LLM disabled (USE_LIVE_AI=false). Use mock generators.",
    );
  }
  if (!canSpendLiveCall()) {
    throw new Error(liveBudgetExhaustedMessage());
  }

  const maxTokens = opts.maxTokens ?? env.LIVE_AI_MAX_OUTPUT_TOKENS;
  const promptChars = opts.messages.reduce((n, m) => n + m.content.length, 0);

  const res = await fetch(`${LLM.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: maxTokens,
      // V4 thinks by default; disable to keep completion tokens cheap.
      thinking: { type: "disabled" },
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned empty content");

  recordLiveCall({
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
    promptChars: data.usage?.prompt_tokens == null ? promptChars : undefined,
    completionChars:
      data.usage?.completion_tokens == null ? content.length : undefined,
  });

  return content;
}

export function llmMode(): "mock" | "live" {
  return liveLlmEnabled() ? "live" : "mock";
}
