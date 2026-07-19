/** Fictional live-ops dashboard data for the Data Motion scenes. */

export interface RegionRow {
  id: string;
  region: string;
  orders: number;
  p95: number;
  health: "healthy" | "degraded";
}

/** Snapshot before the refresh. */
export const ROWS_BEFORE: RegionRow[] = [
  { id: "us-east", region: "us-east-1", orders: 1284, p95: 638, health: "degraded" },
  { id: "eu-west", region: "eu-west-1", orders: 1121, p95: 402, health: "healthy" },
  { id: "ap-south", region: "ap-south-1", orders: 864, p95: 371, health: "healthy" },
  { id: "us-west", region: "us-west-2", orders: 693, p95: 356, health: "healthy" },
];

/** Snapshot after the refresh — eu-west overtakes us-east, latency recovers. */
export const ROWS_AFTER: RegionRow[] = [
  { id: "us-east", region: "us-east-1", orders: 1342, p95: 415, health: "healthy" },
  { id: "eu-west", region: "eu-west-1", orders: 1489, p95: 388, health: "healthy" },
  { id: "ap-south", region: "ap-south-1", orders: 917, p95: 365, health: "healthy" },
  { id: "us-west", region: "us-west-2", orders: 671, p95: 349, health: "healthy" },
];

export const KPIS = [
  {
    id: "conversion",
    label: "Checkout conversion",
    before: 3.42,
    after: 3.58,
    suffix: "%",
    decimals: 2,
    change: 0.16,
    changeLabel: "vs last hour",
  },
  {
    id: "latency",
    label: "Checkout p95",
    before: 638,
    after: 412,
    suffix: " ms",
    decimals: 0,
    change: -226,
    changeLabel: "after rollback",
  },
  {
    id: "carts",
    label: "Active carts",
    before: 1284,
    after: 1431,
    suffix: "",
    decimals: 0,
    change: 147,
    changeLabel: "vs last hour",
  },
] as const;

/** Fixed reference clock so relative timestamps never read the wall clock. */
export const DASH_NOW = Date.UTC(2026, 6, 18, 15, 4, 0);
export const DASH_LAST_UPDATED = DASH_NOW - 42_000;
