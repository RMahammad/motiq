import type { RefreshState } from "@/registry/data/data-refresh-state";

import { KPIS, ROWS_AFTER, ROWS_BEFORE, type RegionRow } from "../data/dashboard";
import { ramp } from "../theme/anim";

export interface DashBeats {
  /** Refresh begins (checking → refreshing). */
  refreshStart: number;
  /** New data has fully arrived. */
  refreshEnd: number;
}

export interface DashFrameState {
  refreshState: RefreshState;
  /** Determinate 0–1 progress while refreshing, else null. */
  progress: number | null;
  updatedCount: number;
  rows: RegionRow[];
  kpiValues: Record<(typeof KPIS)[number]["id"], number>;
  /** True once the refreshed values should show their change chips. */
  settled: boolean;
}

/** Chunky stepper: values advance in `steps` discrete jumps (reads clearly in GIF). */
const stepMix = (a: number, b: number, t: number, steps = 4): number => {
  const q = Math.min(steps, Math.floor(t * (steps + 1)));
  return a + ((b - a) * q) / steps;
};

export function dashboardAt(frame: number, b: DashBeats): DashFrameState {
  const t = ramp(frame, b.refreshStart, b.refreshEnd);
  const refreshing = frame >= b.refreshStart && frame < b.refreshEnd;
  const checkWindow = Math.min(8, Math.max(2, Math.round((b.refreshEnd - b.refreshStart) / 6)));

  const refreshState: RefreshState =
    frame < b.refreshStart
      ? "idle"
      : frame < b.refreshStart + checkWindow
        ? "checking"
        : refreshing
          ? "refreshing"
          : "success";

  const rows = ROWS_BEFORE.map((before, i): RegionRow => {
    const after = ROWS_AFTER[i];
    // Stagger row arrival so updates cascade instead of swapping at once.
    const rowT = ramp(t, 0.15 + i * 0.12, 0.75 + i * 0.06);
    return {
      ...before,
      orders: Math.round(stepMix(before.orders, after.orders, rowT)),
      p95: Math.round(stepMix(before.p95, after.p95, rowT)),
      health: rowT > 0.5 ? after.health : before.health,
    };
  });

  const kpiValues = Object.fromEntries(
    KPIS.map((k) => {
      const kT = ramp(t, 0.2, 0.9);
      const raw = k.before + (k.after - k.before) * kT;
      return [k.id, Number(raw.toFixed(k.decimals))];
    }),
  ) as DashFrameState["kpiValues"];

  return {
    refreshState,
    progress: refreshState === "refreshing" ? Math.round(t * 20) / 20 : null,
    updatedCount: Math.round(t * ROWS_BEFORE.length),
    rows,
    kpiValues,
    settled: frame >= b.refreshEnd,
  };
}
