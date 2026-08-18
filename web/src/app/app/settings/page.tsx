"use client";

// Theme, motion, and default sitting length.

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DeskPage, Plate } from "@/components/ui/plate";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  applyPrefsAttrs,
  DEFAULT_PREFS,
  readPrefs,
  resetPrefs,
  writePrefs,
  type GlPrefs,
  type GlTheme,
} from "@/lib/prefs";
import type { AiBackendId, AiSnapshot } from "@/lib/types";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ring)]",
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 block h-6 w-6 rounded-full shadow-sm transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]",
          checked
            ? "translate-x-5 bg-[var(--text-invert)]"
            : "translate-x-0 bg-[var(--text-secondary)]",
        )}
      />
    </button>
  );
}

function prefsDirty(p: GlPrefs): boolean {
  return (
    p.theme !== DEFAULT_PREFS.theme ||
    p.motion !== DEFAULT_PREFS.motion ||
    p.paperDefault !== DEFAULT_PREFS.paperDefault ||
    p.sessionMinutes !== DEFAULT_PREFS.sessionMinutes
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<GlPrefs | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [ai, setAi] = useState<AiSnapshot | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    document.title = "Settings · GuidedLearning";
    const p = readPrefs();
    setPrefs(p);
    applyPrefsAttrs(p);
  }, []);

  useEffect(() => {
    let stop = false;
    api<AiSnapshot>("/v1/ai")
      .then((snap) => {
        if (!stop) {
          setAi(snap);
          setAiError("");
        }
      })
      .catch((e) => {
        if (!stop) {
          setAiError(e instanceof Error ? e.message : "Could not load AI settings");
        }
      });
    return () => {
      stop = true;
    };
  }, []);

  async function pickBackend(backend: AiBackendId | "auto") {
    if (!ai || ai.envLocked || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    try {
      const next = await api<AiSnapshot>("/v1/ai", {
        method: "PATCH",
        body: JSON.stringify({ backend }),
      });
      setAi(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not save backend");
    }
    setAiBusy(false);
  }

  function update(partial: Partial<GlPrefs>) {
    const next = writePrefs(partial);
    setPrefs(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  }

  function resetToDefaults() {
    const next = resetPrefs();
    setPrefs(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  }

  if (!prefs) {
    return (
      <AppShell settingsActive>
        <DeskPage width="narrow">
          <div className="h-8 w-36 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
          <div className="plate-shell mt-8">
            <div className="plate-inner h-40 animate-pulse" />
          </div>
        </DeskPage>
      </AppShell>
    );
  }

  return (
    <AppShell settingsActive>
      <DeskPage width="narrow">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em]">
              Settings
            </h1>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Preferences apply to this browser for the demo.
            </p>
          </div>
          <p
            className={cn(
              "text-[12px] transition-opacity duration-[var(--duration-fast)]",
              savedFlash
                ? "text-[var(--accent)] opacity-100"
                : "text-[var(--text-tertiary)] opacity-0",
            )}
            aria-live="polite"
          >
            Saved
          </p>
        </div>

        <Plate className="mt-8">
          <p className="text-[15px] font-medium">The desk</p>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            Daylight, or the same table after sunset
          </p>
          <div className="mt-4">
            <SegmentedControl
              ariaLabel="Color theme"
              value={prefs.theme}
              onChange={(v) => update({ theme: v as GlTheme })}
              options={[
                { value: "light", label: "Desk" },
                { value: "dark", label: "Lamp" },
              ]}
            />
          </div>
          <label className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--hairline)] pt-5">
            <div>
              <span className="text-[14px] text-[var(--text-primary)]">Motion</span>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Transitions and path animations
              </p>
            </div>
            <Toggle
              checked={prefs.motion}
              onChange={(v) => update({ motion: v })}
              label="Motion"
            />
          </label>
          <label className="mt-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[14px] text-[var(--text-primary)]">
                Paper lesson default
              </span>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Open lessons on warm paper
              </p>
            </div>
            <Toggle
              checked={prefs.paperDefault}
              onChange={(v) => update({ paperDefault: v })}
              label="Paper lesson default"
            />
          </label>
        </Plate>

        <Plate className="mt-5">
          <p className="text-[15px] font-medium">Notes & quizzes</p>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            DeepSeek needs a key in the API env. Grok, Pi, and OpenCode use
            CLIs already installed on this machine — no GuidedLearning key.
          </p>
          {ai ? (
            <>
              <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
                Writing with{" "}
                <span className="text-[var(--text-secondary)]">
                  {ai.resolved}
                </span>
                {ai.live ? " · live" : " · mock"}
                {ai.envLocked ? " · locked by LLM_BACKEND" : null}
              </p>
              <div
                role="radiogroup"
                aria-label="AI backend"
                className="mt-4 space-y-1.5"
              >
                {(
                  [
                    {
                      id: "auto" as const,
                      label: "Auto",
                      detail: ai.live
                        ? `Resolves to ${ai.resolved}`
                        : "Mock unless live AI is on or you pick a CLI",
                      ready: true,
                    },
                    ...ai.backends.map((b) => ({
                      id: b.id,
                      label: b.label,
                      detail: b.ready
                        ? b.needsKey
                          ? "Ready · uses DEEPSEEK_API_KEY"
                          : "Ready · uses the local CLI"
                        : b.reason || "Not ready",
                      ready: b.ready,
                    })),
                  ] as const
                ).map((opt) => {
                  const selected = ai.requested === opt.id;
                  const disabled =
                    ai.envLocked ||
                    aiBusy ||
                    (opt.id !== "auto" && opt.id !== "mock" && !opt.ready);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      onClick={() => void pickBackend(opt.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "bg-[var(--accent-muted)]"
                          : "hover:bg-[var(--surface-2)]",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="text-[14px] font-medium">{opt.label}</span>
                      <span className="text-[12px] text-[var(--text-tertiary)]">
                        {opt.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">
              {aiError || "Loading backends…"}
            </p>
          )}
          {ai && aiError ? (
            <p className="mt-3 text-[13px] text-[var(--danger)]" role="alert">
              {aiError}
            </p>
          ) : null}
        </Plate>

        <Plate className="mt-5">
          <p className="text-[15px] font-medium">Sittings</p>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            Minutes used when filling today&apos;s queue
          </p>
          <div className="mt-4">
            <SegmentedControl
              ariaLabel="Default sitting minutes"
              value={String(prefs.sessionMinutes)}
              onChange={(v) => update({ sessionMinutes: Number(v) })}
              options={[
                { value: "15", label: "15" },
                { value: "25", label: "25" },
                { value: "45", label: "45" },
                { value: "60", label: "60" },
              ]}
            />
          </div>
          <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
            Current:{" "}
            <span className="tabular text-[var(--text-secondary)]">
              {prefs.sessionMinutes} min
            </span>
          </p>
        </Plate>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Demo preferences stay in this browser — nothing is synced yet.
          </p>
          <button
            type="button"
            disabled={!prefsDirty(prefs)}
            onClick={resetToDefaults}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
              prefsDirty(prefs)
                ? "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                : "cursor-not-allowed text-[var(--text-disabled)]",
            )}
          >
            Reset defaults
          </button>
        </div>
      </DeskPage>
    </AppShell>
  );
}
