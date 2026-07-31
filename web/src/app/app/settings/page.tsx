"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/cn";

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
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
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

export default function SettingsPage() {
  const [motion, setMotion] = useState(true);
  const [paperDefault, setPaperDefault] = useState(false);
  const [session, setSession] = useState("25");

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
        <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
          Preferences apply to this browser for the demo.
        </p>

        <section className="surface-card mt-8 space-y-5 p-5">
          <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
            Experience
          </p>
          <label className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[14px] text-[var(--text-primary)]">Motion</span>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Transitions and map animations
              </p>
            </div>
            <Toggle
              checked={motion}
              onChange={setMotion}
              label="Motion"
            />
          </label>
          <label className="flex items-center justify-between gap-4 border-t border-[var(--hairline)] pt-5">
            <div>
              <span className="text-[14px] text-[var(--text-primary)]">
                Paper lesson default
              </span>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Open lessons in warm paper theme
              </p>
            </div>
            <Toggle
              checked={paperDefault}
              onChange={setPaperDefault}
              label="Paper lesson default"
            />
          </label>
        </section>

        <section className="surface-card mt-4 p-5">
          <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
            Sessions
          </p>
          <p className="mt-3 text-[14px] text-[var(--text-primary)]">
            Default session length
          </p>
          <p className="mb-3 text-[12px] text-[var(--text-tertiary)]">
            Minutes used when packing today&apos;s queue
          </p>
          <SegmentedControl
            ariaLabel="Default session minutes"
            value={session}
            onChange={setSession}
            options={[
              { value: "15", label: "15" },
              { value: "25", label: "25" },
              { value: "45", label: "45" },
              { value: "60", label: "60" },
            ]}
          />
        </section>
      </div>
    </AppShell>
  );
}
