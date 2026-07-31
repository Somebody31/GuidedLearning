import { cn } from "@/lib/cn";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/states";
import type { LessonStatus } from "@/lib/types";

export function StateBadge({
  status,
  className,
}: {
  status: LessonStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        className,
      )}
      style={{
        color: STATUS_COLOR[status],
        borderColor: `${STATUS_COLOR[status]}55`,
        background: `${STATUS_COLOR[status]}14`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: STATUS_COLOR[status] }}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
