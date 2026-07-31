import { cn } from "@/lib/cn";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/states";
import type { LessonStatus } from "@/lib/types";

/** Short labels for tight surfaces (map nodes). */
const COMPACT_LABEL: Partial<Record<LessonStatus, string>> = {
  in_progress: "Active",
  remediation: "Remed.",
  available: "Ready",
};

export function StateBadge({
  status,
  className,
  compact = false,
}: {
  status: LessonStatus;
  className?: string;
  /** Smaller padding / short label for map nodes */
  compact?: boolean;
}) {
  const label = compact
    ? (COMPACT_LABEL[status] ?? STATUS_LABEL[status])
    : STATUS_LABEL[status];

  return (
    <span
      className={cn(
        // Title case, zero letter-spacing — uppercase + tracking-wide read as "MA ST ERED"
        "inline-flex max-w-full items-center rounded-full border font-medium leading-none [letter-spacing:0] whitespace-nowrap",
        compact
          ? "gap-1 px-1.5 py-0.5 text-[10px]"
          : "gap-1.5 px-2 py-0.5 text-[11px]",
        className,
      )}
      style={{
        color: STATUS_COLOR[status],
        borderColor: `${STATUS_COLOR[status]}55`,
        background: `${STATUS_COLOR[status]}14`,
      }}
    >
      <span
        className={cn(
          "shrink-0 rounded-full",
          compact ? "h-1 w-1" : "h-1.5 w-1.5",
        )}
        style={{ background: STATUS_COLOR[status] }}
        aria-hidden
      />
      {label}
    </span>
  );
}
