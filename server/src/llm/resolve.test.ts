import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "../env";
import { backendInfo } from "./detect";
import { resetLlmPrefsCache, writeLlmPrefs } from "./prefs";
import { liveLlmEnabled, resolveBackend } from "./resolve";

const prev = {
  backend: env.LLM_BACKEND,
  live: env.USE_LIVE_AI,
  grok: env.GROK_BIN,
  key: env.DEEPSEEK_API_KEY,
  dataDir: env.DATA_DIR,
};

afterEach(() => {
  env.LLM_BACKEND = prev.backend;
  env.USE_LIVE_AI = prev.live;
  env.GROK_BIN = prev.grok;
  env.DEEPSEEK_API_KEY = prev.key;
  env.DATA_DIR = prev.dataDir;
  resetLlmPrefsCache();
});

describe("detectBackends", () => {
  test("missing grok binary is not ready", () => {
    env.GROK_BIN = "/definitely/not/a/grok-binary";
    const info = backendInfo("grok");
    expect(info.installed).toBe(false);
    expect(info.ready).toBe(false);
  });

  test("an existing path counts as installed", () => {
    env.GROK_BIN = process.execPath;
    const info = backendInfo("grok");
    expect(info.installed).toBe(true);
    expect(info.ready).toBe(true);
  });
});

describe("resolveBackend", () => {
  test("explicit mock stays mock", () => {
    env.LLM_BACKEND = "mock";
    env.USE_LIVE_AI = true;
    expect(resolveBackend()).toBe("mock");
    expect(liveLlmEnabled()).toBe(false);
  });

  test("explicit grok is used when the binary exists", () => {
    env.LLM_BACKEND = "grok";
    env.GROK_BIN = process.execPath;
    env.USE_LIVE_AI = false;
    expect(resolveBackend()).toBe("grok");
  });

  test("explicit grok falls back to mock when missing", () => {
    env.LLM_BACKEND = "grok";
    env.GROK_BIN = "/definitely/not/a/grok-binary";
    expect(resolveBackend()).toBe("mock");
  });

  test("auto + USE_LIVE_AI=false stays mock even if a CLI is ready", async () => {
    env.DATA_DIR = await mkdtemp(join(tmpdir(), "gl-prefs-"));
    resetLlmPrefsCache();
    writeLlmPrefs("auto");
    env.LLM_BACKEND = "auto";
    env.USE_LIVE_AI = false;
    env.GROK_BIN = process.execPath;
    env.DEEPSEEK_API_KEY = "sk-test";
    expect(resolveBackend()).toBe("mock");
  });

  test("auto + USE_LIVE_AI=true prefers DeepSeek when keyed", async () => {
    env.DATA_DIR = await mkdtemp(join(tmpdir(), "gl-prefs-"));
    resetLlmPrefsCache();
    writeLlmPrefs("auto");
    env.LLM_BACKEND = "auto";
    env.USE_LIVE_AI = true;
    env.DEEPSEEK_API_KEY = "sk-test";
    expect(resolveBackend()).toBe("deepseek");
  });
});
