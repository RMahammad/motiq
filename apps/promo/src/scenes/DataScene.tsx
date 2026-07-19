import React from "react";
import { useCurrentFrame } from "remotion";

import { KpiNumberMorph } from "@/registry/data/kpi-number-morph";
import { DataRefreshState } from "@/registry/data/data-refresh-state";
import { StreamingDataRows, type Column } from "@/registry/data/streaming-data-rows";

import { dashboardAt, type DashBeats } from "../adapters/dashboard";
import { DASH_LAST_UPDATED, DASH_NOW, KPIS, type RegionRow } from "../data/dashboard";

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");

const COLUMNS: Column<RegionRow>[] = [
  { key: "region", header: "Region", value: (r) => r.region },
  {
    key: "orders",
    header: "Orders / hr",
    align: "end",
    numeric: true,
    value: (r) => r.orders,
    format: fmtInt,
  },
  {
    key: "p95",
    header: "p95",
    align: "end",
    numeric: true,
    value: (r) => r.p95,
    format: (n) => `${fmtInt(n)} ms`,
  },
  {
    key: "health",
    header: "Health",
    align: "end",
    value: (r) => r.health,
    render: (r) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          fontWeight: 600,
          color: r.health === "healthy" ? "var(--color-success)" : "var(--color-warning)",
        }}
      >
        <span aria-hidden>{r.health === "healthy" ? "●" : "▲"}</span>
        {r.health}
      </span>
    ),
  },
];

/**
 * Live-ops dashboard: three KPI morphs, the refresh lifecycle, and the
 * streaming table — all fed by `dashboardAt(frame)`.
 */
export const DataDashboard: React.FC<{
  beats: DashBeats;
  width?: number;
  showKpis?: boolean;
}> = ({ beats, width = 880, showKpis = true }) => {
  const frame = useCurrentFrame();
  const s = dashboardAt(frame, beats);

  return (
    <div style={{ width, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {showKpis ? (
        <div style={{ display: "flex", gap: 16 }}>
          {KPIS.map((k) => (
            <KpiNumberMorph
              key={k.id}
              label={k.label}
              value={s.kpiValues[k.id]}
              suffix={k.suffix}
              decimals={k.decimals}
              change={s.settled ? k.change : undefined}
              changeLabel={s.settled ? k.changeLabel : undefined}
              state="idle"
              style={{ flex: 1 }}
            />
          ))}
        </div>
      ) : null}
      <DataRefreshState
        mode="inline"
        state={s.refreshState}
        progress={s.progress}
        updatedCount={s.settled ? s.updatedCount : undefined}
        totalCount={4}
        label="Regional orders"
        lastUpdated={DASH_LAST_UPDATED}
        now={DASH_NOW}
        onRefresh={() => undefined}
        reducedMotion
      />
      <StreamingDataRows<RegionRow>
        rows={s.rows}
        columns={COLUMNS}
        getRowId={(r) => r.id}
        sort={{ key: "orders", dir: "desc" }}
        onSortChange={() => undefined}
        announceUpdates={false}
        caption="Orders by region"
      />
    </div>
  );
};
