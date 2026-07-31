"use client";

import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  className?: string;
}) {
  function move(delta: number) {
    const i = options.findIndex((o) => o.value === value);
    if (i < 0) return;
    const next = options[(i + delta + options.length) % options.length];
    if (next) onChange(next.value);
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--surface-0)] p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-w-[3rem] rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-[13px] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
              selected
                ? "bg-[var(--surface-2)] font-medium text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--hairline-strong),var(--shadow-card)] ring-1 ring-[var(--accent)]/20"
                : "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
