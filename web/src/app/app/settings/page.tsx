"use client";

// Theme, motion, and default sitting length.

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DeskPage, Plate } from "@/components/ui/plate";
import { SegmentedControl } from "@/components/ui/segmented-control";
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

  useEffect(() => {
    document.title = "Settings · GuidedLearning";
    const p = readPrefs();
    setPrefs(p);
    applyPrefsAttrs(p);
  }, []);

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
