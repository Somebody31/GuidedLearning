"use client";

// XYFlow map of units and lessons.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LessonNode, type LessonNodeData } from "./lesson-node";
import type { Course } from "@/lib/types";

const nodeTypes: NodeTypes = {
  lesson: LessonNode,
};

/** Canvas fillStyle does not resolve CSS custom properties. */
function useThemeCanvasColors() {
  const [colors, setColors] = useState({
    gridDot: "rgba(255,255,255,0.04)",
    minimapMask: "rgba(7,7,10,0.72)",
    accent: "#2dd4bf",
    due: "#fbbf24",
    weak: "#fb7185",
    mastered: "#34d399",
    locked: "#6b6b76",
    progress: "#38bdf8",
  });

  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const get = (name: string, fallback: string) =>
        s.getPropertyValue(name).trim() || fallback;
      setColors({
        gridDot: get("--grid-dot", "rgba(255,255,255,0.04)"),
        minimapMask: get("--minimap-mask", "rgba(7,7,10,0.72)"),
        accent: get("--accent", "#2dd4bf"),
        due: get("--state-due", "#fbbf24"),
        weak: get("--state-weak", "#fb7185"),
        mastered: get("--state-mastered", "#34d399"),
        locked: get("--state-locked", "#6b6b76"),
        progress: get("--state-progress", "#38bdf8"),
      });
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return colors;
}

export function CourseAtlas({
  course,
  selectedId,
  onSelect,
}: {
  course: Course;
  selectedId: string | null;
  onSelect: (lessonId: string | null) => void;
}) {
  const canvas = useThemeCanvasColors();

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (const unit of course.units) {
      unit.lessonIds.forEach((lessonId, idx) => {
        const lesson = course.lessons[lessonId];
        if (!lesson) return;
        const pos = lesson.position ?? {
          x: idx * 240,
          y: unit.order * 180,
        };
        nodes.push({
          id: lesson.id,
          type: "lesson",
          position: pos,
          data: {
            title: lesson.title,
            unitTitle: unit.title,
            status: lesson.status,
            mastery: lesson.mastery,
            estMinutes: lesson.estMinutes,
            selected: selectedId === lesson.id,
          } satisfies LessonNodeData,
          ariaLabel: `Lesson: ${lesson.title}, ${lesson.status}, estimated ${lesson.estMinutes} minutes, mastery ${Math.round(lesson.mastery * 100)} percent`,
        });

        if (idx > 0) {
          const prev = unit.lessonIds[idx - 1];
          edges.push({
            id: `${prev}-${lessonId}`,
            source: prev,
            target: lessonId,
            style: {
              stroke:
                lesson.status === "locked"
                  ? "var(--state-locked)"
                  : "var(--hairline-strong)",
              strokeWidth: 1.5,
            },
          });
        }
      });

      // soft edge from last of previous unit
      if (unit.order > 0) {
        const prevUnit = course.units.find((u) => u.order === unit.order - 1);
        const prevLast = prevUnit?.lessonIds[prevUnit.lessonIds.length - 1];
        const first = unit.lessonIds[0];
        if (prevLast && first) {
          edges.push({
            id: `bridge-${prevLast}-${first}`,
            source: prevLast,
            target: first,
            style: {
              stroke: "var(--hairline)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            },
          });
        }
      }
    }

    return { nodes, edges };
  }, [course, selectedId]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelect(node.id);
    },
    [onSelect],
  );

  const onPaneClick = useCallback(() => onSelect(null), [onSelect]);

  return (
    <div className="path-wash h-full min-h-[280px] w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--hairline)] md:min-h-[420px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.35}
        maxZoom={1.4}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background gap={24} size={1} color={canvas.gridDot} />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="!mb-16 !ml-3 sm:!mb-3 !overflow-hidden !rounded-[var(--radius-md)] !border-[var(--hairline)] !bg-[var(--surface-1)] !shadow-none [&>button]:!border-[var(--hairline)] [&>button]:!bg-[var(--surface-1)] [&>button]:!fill-[var(--text-secondary)]"
        />
        <MiniMap
          className="!m-3 !hidden !overflow-hidden !rounded-[var(--radius-md)] !border-[var(--hairline)] !bg-[var(--surface-0)] md:!block"
          nodeColor={(n) => {
            const status = (n.data as LessonNodeData | undefined)?.status;
            if (status === "due") return canvas.due;
            if (status === "weak") return canvas.weak;
            if (status === "mastered") return canvas.mastered;
            if (status === "locked") return canvas.locked;
            if (status === "in_progress") return canvas.progress;
            return canvas.accent;
          }}
          maskColor={canvas.minimapMask}
        />
      </ReactFlow>
    </div>
  );
}
