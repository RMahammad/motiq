import React from "react";
import { AbsoluteFill } from "remotion";

import {
  WorkflowTopologyField,
  type TopologyConnection,
  type TopologyNode,
  type TopologyNodeStatus,
} from "@/registry/backgrounds/workflow-topology-field";

/**
 * The real WorkflowTopologyField as a quiet brand environment. It renders in
 * its genuine reduced-motion static mode (deterministic SVG), and the promo
 * animates it by advancing node/connection *statuses* with the composition
 * frame — real state changes, no wall-clock.
 *
 * The activation wave is CIRCULAR (completed trail behind a moving head,
 * wrapping around), so the pattern is continuous across the loop boundary —
 * frame N and frame N+period are identical, and the wrap itself is just the
 * wave moving on, not a reset.
 */

const COLS: string[][] = [
  ["trigger", "ingest"],
  ["validate", "enrich"],
  ["assemble"],
  ["review"],
  ["deploy", "notify"],
];

const NODES: Omit<TopologyNode, "status">[] = [
  { id: "trigger", x: 0.06, y: 0.32, label: "Trigger", icon: "trigger", tier: "secondary", group: "g0" },
  { id: "ingest", x: 0.07, y: 0.68, label: "Ingest", icon: "queue", tier: "secondary", group: "g0" },
  { id: "validate", x: 0.27, y: 0.24, label: "Validate", icon: "validate", tier: "secondary", group: "g1" },
  { id: "enrich", x: 0.28, y: 0.62, label: "Enrich", icon: "transform", tier: "secondary", group: "g1" },
  { id: "assemble", x: 0.5, y: 0.42, label: "Assemble", icon: "transform", tier: "primary", group: "g2" },
  { id: "review", x: 0.72, y: 0.3, label: "Review", icon: "branch", tier: "secondary", group: "g3" },
  { id: "deploy", x: 0.92, y: 0.38, label: "Deploy", icon: "deliver", tier: "primary", group: "g4" },
  { id: "notify", x: 0.9, y: 0.74, label: "Notify", icon: "notify", tier: "secondary", group: "g4" },
];

const CONNECTIONS: TopologyConnection[] = [
  { id: "trigger>validate", from: "trigger", to: "validate" },
  { id: "ingest>enrich", from: "ingest", to: "enrich" },
  { id: "validate>assemble", from: "validate", to: "assemble" },
  { id: "enrich>assemble", from: "enrich", to: "assemble" },
  { id: "assemble>review", from: "assemble", to: "review" },
  { id: "review>deploy", from: "review", to: "deploy" },
  { id: "review>notify", from: "review", to: "notify" },
];

const colOf = (id: string): number => COLS.findIndex((c) => c.includes(id));

export const TopologyBackdrop: React.FC<{
  /** Absolute composition frame — keeps loop boundaries seamless. */
  frame: number;
  /** Frames per full trip of the wave head across (and around) the columns. */
  period: number;
  opacity?: number;
  showLabels?: boolean;
}> = ({ frame, period, opacity = 0.55, showLabels = true }) => {
  const C = COLS.length;
  const t = (((frame % period) + period) % period) / period;
  const head = Math.min(C - 1, Math.floor(t * C));

  // Circular distance from the wave head, looking backwards.
  const behind = (col: number): number => (((head - col) % C) + C) % C;

  const statusOf = (id: string): TopologyNodeStatus => {
    const d = behind(colOf(id));
    if (d === 0) return "active";
    if (d <= 2) return "completed"; // trailing wave, wraps around the loop
    return colOf(id) === (head + 1) % C ? "pending" : "idle";
  };

  const SUBS: Record<TopologyNodeStatus, string> = {
    completed: "done",
    active: "running",
    pending: "queued",
    idle: "idle",
    failed: "failed",
  };

  const nodes: TopologyNode[] = NODES.map((n) => {
    const status = statusOf(n.id);
    const sub = n.tier === "primary" ? SUBS[status] : undefined;
    return { ...n, status, sub };
  });

  // The "signal": connections feeding the active column light up.
  const activeConnectionIds = CONNECTIONS.filter(
    (c) => colOf(c.to) === head || colOf(c.from) === head,
  ).map((c) => c.id as string);

  return (
    <AbsoluteFill style={{ opacity }}>
      <WorkflowTopologyField
        nodes={nodes}
        connections={CONNECTIONS}
        activeNodeIds={COLS[head]}
        activeConnectionIds={activeConnectionIds}
        contentPlacement="center"
        showLabels={showLabels}
        density={0.75}
        depth={1}
        intensity={0.8}
        seed={7}
        reducedMotion
        interactive={false}
        style={{ position: "absolute", inset: 0 }}
      />
    </AbsoluteFill>
  );
};
