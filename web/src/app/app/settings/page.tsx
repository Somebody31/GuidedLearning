"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { SegmentedControl } from "@/components/ui/segmented-control";

export default function SettingsPage() {
  const [motion, setMotion] = useState(true);
  const [paperDefault, setPaperDefault] = useState(false);
  const [session, setSession] = useState("25");

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
        <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>
        <div className="mt-8 space-y-6">
          <label className="flex items-center justify-between gap-4">
            <span className="text-[14px]">Motion</span>
            <button
              type="button"
              role="switch"
              aria-checked={motion}
              onClick={() => setMotion((m) => !m)}
              className={
                motion
                  ? "h-7 w-12 rounded-full bg-[var(--accent)] px-0.5 transition"
                  : "h-7 w-12 rounded-full bg-[var(--surface-3)] px-0.5 transition"
              }
            >
              <span
                className={
                  motion
                    ? "ml-auto block h-6 w-6 rounded-full bg-[var(--text-invert)]"
                    : "block h-6 w-6 rounded-full bg-[var(--text-secondary)]"
                }
              />
            </button>
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-[14px]">Paper lesson default</span>
            <button
              type="button"
              role="switch"
              aria-checked={paperDefault}
              onClick={() => setPaperDefault((m) => !m)}
              className={
                paperDefault
                  ? "h-7 w-12 rounded-full bg-[var(--accent)] px-0.5"
                  : "h-7 w-12 rounded-full bg-[var(--surface-3)] px-0.5"
              }
            >
              <span
                className={
                  paperDefault
                    ? "ml-auto block h-6 w-6 rounded-full bg-[var(--text-invert)]"
                    : "block h-6 w-6 rounded-full bg-[var(--text-secondary)]"
                }
              />
            </button>
          </label>
          <div>
            <p className="mb-2 text-[14px]">Default session length</p>
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
