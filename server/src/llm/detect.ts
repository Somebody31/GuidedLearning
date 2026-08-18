// Which generation CLIs are on PATH.

import { existsSync } from "node:fs";
import { env } from "../env";

export type BackendId = "mock" | "deepseek" | "grok" | "pi" | "opencode";

export type BackendInfo = {
  id: BackendId;
  label: string;
  installed: boolean;
  ready: boolean;
  needsKey: boolean;
  reason?: string;
};

function which(bin: string): string | null {
  if (!bin) return null;
  if (bin.includes("/") || bin.includes("\\")) {
    return existsSync(bin) ? bin : null;
  }
  return Bun.which(bin) ?? null;
}

export function detectBackends(): BackendInfo[] {
  const grokPath = which(env.GROK_BIN);
  const piPath = which(env.PI_BIN);
  const ocPath = which(env.OPENCODE_BIN);
  const deepseekKey = Boolean(env.DEEPSEEK_API_KEY);

  return [
    {
      id: "mock",
      label: "Mock",
      installed: true,
      ready: true,
      needsKey: false,
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      installed: true,
      ready: deepseekKey,
      needsKey: true,
      reason: deepseekKey ? undefined : "Set DEEPSEEK_API_KEY",
    },
    {
      id: "grok",
      label: "Grok",
      installed: Boolean(grokPath),
      ready: Boolean(grokPath),
      needsKey: false,
      reason: grokPath ? undefined : "grok not on PATH",
    },
    {
      id: "pi",
      label: "Pi",
      installed: Boolean(piPath),
      ready: Boolean(piPath),
      needsKey: false,
      reason: piPath ? undefined : "pi not on PATH",
    },
    {
      id: "opencode",
      label: "OpenCode",
      installed: Boolean(ocPath),
      ready: Boolean(ocPath),
      needsKey: false,
      reason: ocPath ? undefined : "opencode not on PATH",
    },
  ];
}

export function backendInfo(id: BackendId): BackendInfo {
  return detectBackends().find((b) => b.id === id) ?? {
    id,
    label: id,
    installed: false,
    ready: false,
    needsKey: false,
    reason: "Unknown backend",
  };
}
