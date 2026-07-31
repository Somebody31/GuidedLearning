"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Lock } from "lucide-react";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { StateBadge } from "@/components/ui/state-badge";
import { STATUS_COLOR } from "@/lib/states";
import type { LessonStatus } from "@/lib/types";

export type LessonNodeData = {
  title: string;
  unitTitle: string;
  status: LessonStatus;
  mastery: number;
  estMinutes: number;
  selected?: boolean;
};

function LessonNodeComponent({ data }: NodeProps) {
  const d = data as LessonNodeData;
  const color = STATUS_COLOR[d.status];
  const locked = d.status === "locked";

  return (
    <div
      className="w-[212px] rounded-[var(--radius-lg)] border bg-[var(--surface-1)] px-3 py-2.5 transition-[border-color,box-shadow,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5"
      style={{
        borderColor: d.selected ? "var(--accent)" : `${color}66`,
        borderStyle: locked ? "dashed" : "solid",
        opacity: locked ? 0.72 : 1,
        boxShadow: d.selected
          ? "0 0 0 2px var(--accent-ring), 0 12px 40px rgba(0,0,0,0.35)"
          : "0 12px 40px rgba(0,0,0,0.35)",
        cursor: locked ? "not-allowed" : "pointer",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-[var(--text-tertiary)]"
      />
      <div className="flex items-start justify-between gap-2">
        <MasteryRing value={d.mastery} size={22} showLabel={false} />
        <span className="tabular text-[11px] text-[var(--text-tertiary)]">
          {d.estMinutes} min
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">{d.unitTitle}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text-primary)]">
        {locked && (
          <Lock
            className="mr-1 inline h-3 w-3 text-[var(--state-locked)]"
            aria-hidden
          />
        )}
        {d.title}
      </p>
      <div className="mt-2">
        <StateBadge status={d.status} compact />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-[var(--text-tertiary)]"
      />
    </div>
  );
}

export const LessonNode = memo(LessonNodeComponent);
