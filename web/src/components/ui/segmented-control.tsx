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
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
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
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-w-[3rem] rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-[13px] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]",
              selected
                ? "bg-[var(--surface-2)] font-medium text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--hairline-strong)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
