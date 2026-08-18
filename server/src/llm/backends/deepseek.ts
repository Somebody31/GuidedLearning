// HTTP chat completions against DeepSeek.

import { env } from "../../env";
import { LLM } from "../models";
import type { ChatMessage } from "../messages";

export async function deepseekComplete(opts: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
  maxTokens: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: LLM.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens,
    thinking: { type: "disabled" },
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${LLM.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
  if (!content) {
    throw new Error("DeepSeek returned empty content");
  }
  return content;
}
