import { env, liveLlmEnabled } from "../env";
import { LLM } from "./models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * DeepSeek chat — only when USE_LIVE_AI=true and DEEPSEEK_API_KEY set.
 * Default path uses mock generators (no credits).
 */
export async function chatCompletion(opts: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  if (!liveLlmEnabled()) {
    throw new Error(
      "Live LLM disabled (USE_LIVE_AI=false). Use mock generators.",
    );
  }

  const res = await fetch(`${LLM.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned empty content");
  return content;
}

export function llmMode(): "mock" | "live" {
  return liveLlmEnabled() ? "live" : "mock";
}
