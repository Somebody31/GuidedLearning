// Chip for PDF parse status (queued, ready, failed).

import { cn } from "@/lib/cn";

export type FileParseStatus = "queued" | "parsing" | "ready" | "failed";

const LABEL: Record<FileParseStatus, string> = {
  queued: "Queued",
  parsing: "Parsing",
  ready: "Ready",
  failed: "Failed",
};

const STYLES: Record<FileParseStatus, string> = {
  ready:
    "border-[var(--success)]/30 bg-[rgba(52,211,153,0.1)] text-[var(--success)]",
  failed:
    "border-[var(--danger)]/30 bg-[rgba(248,113,113,0.1)] text-[var(--danger)]",
  parsing:
    "border-[var(--info)]/30 bg-[rgba(56,189,248,0.1)] text-[var(--info)]",
  queued:
    "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--text-tertiary)]",
};

export function FileStatusChip({
  status,
  className,
}: {
  status: FileParseStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-none [letter-spacing:0]",
        STYLES[status],
        className,
      )}
    >
      {status === "parsing" ? (
        <span
          className="spin-soft box-border h-2.5 w-2.5 shrink-0 rounded-full border border-current border-t-transparent opacity-90"
          aria-hidden
        />
      ) : (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {LABEL[status]}
    </span>
  );
}
