// Circular progress for how well a lesson is known.

import { cn } from "@/lib/cn";

export function MasteryRing({
  value,
  size = 28,
  className,
  showLabel = true,
}: {
  value: number;
  size?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={`${pct}% mastery`}
    >
      <svg
        width={size}
        height={size}
        className="shrink-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hairline-strong)"
          strokeWidth={stroke}
        />
        <circle
          className="mastery-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: `stroke-dashoffset var(--duration-med) var(--ease-out-soft)`,
          }}
        />
      </svg>
      {showLabel && (
        <span
          className="tabular text-[12px] text-[var(--text-secondary)]"
          aria-hidden
        >
          {pct}%
        </span>
      )}
    </div>
  );
}
