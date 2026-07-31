import { env } from "../env";
import { LLM } from "./models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * DeepSeek OpenAI-compatible chat completions.
 * No-op until DEEPSEEK_API_KEY is set (B2+ jobs call this).
 */
export async function chatCompletion(opts: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set — cannot call DeepSeek V4 Flash",
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
      ...(opts.json
        ? { response_format: { type: "json_object" } }
        : {}),
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
