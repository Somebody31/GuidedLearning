import { env } from "../env";

/** Process-local spend guard — reset on server restart. */
let liveCalls = 0;
let promptTokensApprox = 0;
let completionTokensApprox = 0;

export function liveBudgetSnapshot() {
  return {
    callsUsed: liveCalls,
    callsMax: env.LIVE_AI_MAX_CALLS,
    callsRemaining: Math.max(0, env.LIVE_AI_MAX_CALLS - liveCalls),
    maxOutputTokens: env.LIVE_AI_MAX_OUTPUT_TOKENS,
    lazyOnly: env.LIVE_AI_LAZY_ONLY,
    promptTokensApprox,
    completionTokensApprox,
  };
}

export function canSpendLiveCall(): boolean {
  return liveCalls < env.LIVE_AI_MAX_CALLS;
}

export function recordLiveCall(opts?: {
  promptTokens?: number;
  completionTokens?: number;
  promptChars?: number;
  completionChars?: number;
}) {
  liveCalls += 1;
  if (opts?.promptTokens != null) promptTokensApprox += opts.promptTokens;
  else if (opts?.promptChars != null) {
    promptTokensApprox += Math.ceil(opts.promptChars / 4);
  }
  if (opts?.completionTokens != null) {
    completionTokensApprox += opts.completionTokens;
  } else if (opts?.completionChars != null) {
    completionTokensApprox += Math.ceil(opts.completionChars / 4);
  }
}

export function liveBudgetExhaustedMessage(): string {
  return `Live AI call budget exhausted (${env.LIVE_AI_MAX_CALLS}/process). Falling back to mock. Restart server or raise LIVE_AI_MAX_CALLS.`;
}
