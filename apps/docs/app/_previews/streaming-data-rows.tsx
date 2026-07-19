"use client";

import * as React from "react";

import {
  StreamingDataRows,
  StatusPill,
  type Column,
  type SortState,
} from "@/registry/data/streaming-data-rows";
import { formatNumber, formatTimestamp } from "@/lib/motiq";

/* Clearly-fictional order-processing feed. Data is illustrative demo data. */

interface Order {
  id: string;
  ref: string;
  customer: string;
  amount: number;
  status: string;
  updatedAt: number;
}

const CUSTOMERS = [
  "Meridian Supply Co.",
  "Northwind Traders",
  "Aurora Robotics",
  "Cobalt & Finch",
  "Harbor Freight Lab",
  "Vireo Analytics",
  "Solstice Foods",
  "Ninefold Studio",
  "Tidewater Optics",
  "Basalt Interiors",
];
const STATUSES = ["queued", "active", "waiting", "completed", "failed"];

// Deterministic initial rows so the server-rendered HTML matches the first
// client render (no hydration mismatch). Live mutations (client-only) randomize.
const BASE_TS = 1_700_000_000_000;
const INITIAL_ROWS: Order[] = [
  { id: "ord_1042", ref: "#1042", customer: "Vireo Analytics", amount: 428.5, status: "active", updatedAt: BASE_TS + 4000 },
  { id: "ord_1043", ref: "#1043", customer: "Solstice Foods", amount: 91.2, status: "queued", updatedAt: BASE_TS + 3000 },
  { id: "ord_1044", ref: "#1044", customer: "Ninefold Studio", amount: 764, status: "completed", updatedAt: BASE_TS + 2000 },
  { id: "ord_1045", ref: "#1045", customer: "Tidewater Optics", amount: 312.75, status: "waiting", updatedAt: BASE_TS + 1000 },
  { id: "ord_1046", ref: "#1046", customer: "Basalt Interiors", amount: 559.9, status: "failed", updatedAt: BASE_TS },
];

let seq = 1047;
function makeOrder(now: number): Order {
  const n = seq++;
  return {
    id: `ord_${n}`,
    ref: `#${n}`,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    amount: Math.round((40 + Math.random() * 960) * 100) / 100,
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    updatedAt: now,
  };
}

function seed(now: number): Order[] {
  return Array.from({ length: 5 }, () => makeOrder(now));
}

type PreviewState = "idle" | "loading" | "error";

export function StreamingDataRowsPreview() {
  const [rows, setRows] = React.useState<Order[]>(() => INITIAL_ROWS);
  const [sort, setSort] = React.useState<SortState | null>({ key: "updatedAt", dir: "desc" });
  const [paused, setPaused] = React.useState(false);
  const [state, setState] = React.useState<PreviewState>("idle");

  const columns = React.useMemo<Column<Order>[]>(
    () => [
      {
        key: "ref",
        header: "Order",
        sortable: true,
        value: (r) => r.ref,
        sortAccessor: (r) => Number(r.ref.replace("#", "")),
        render: (r) => <span className="font-mono text-[12.5px] text-[var(--color-muted)]">{r.ref}</span>,
      },
      {
        key: "customer",
        header: "Customer",
        sortable: true,
        value: (r) => r.customer,
        render: (r) => <span className="font-medium text-[var(--color-fg)]">{r.customer}</span>,
      },
      {
        key: "amount",
        header: "Amount",
        align: "end",
        sortable: true,
        numeric: true,
        value: (r) => r.amount,
        format: (n) => formatNumber(n, { currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        value: (r) => r.status,
        render: (r) => <StatusPill status={r.status} />,
      },
      {
        key: "updatedAt",
        header: "Updated",
        align: "end",
        sortable: true,
        value: (r) => r.updatedAt,
        render: (r) => (
          <span className="text-[12.5px] text-[var(--color-muted)] tabular-nums">
            {formatTimestamp(r.updatedAt, { format: (d) => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d) })}
          </span>
        ),
      },
    ],
    [],
  );

  /* --- controls ---------------------------------------------------------- */
  const addRow = () => setRows((rs) => [makeOrder(Date.now()), ...rs].slice(0, 12));
  const removeRow = () => setRows((rs) => (rs.length ? rs.slice(0, -1) : rs));
  const reset = () => {
    setRows(seed(Date.now()));
    setState("idle");
  };
  const updateRandom = () =>
    setRows((rs) => {
      if (!rs.length) return rs;
      const i = Math.floor(Math.random() * rs.length);
      const delta = Math.round((Math.random() * 240 - 120) * 100) / 100;
      return rs.map((r, idx) =>
        idx === i ? { ...r, amount: Math.max(0, Math.round((r.amount + delta) * 100) / 100), updatedAt: Date.now() } : r,
      );
    });
  const changeStatus = () =>
    setRows((rs) => {
      if (!rs.length) return rs;
      const i = Math.floor(Math.random() * rs.length);
      return rs.map((r, idx) =>
        idx === i ? { ...r, status: STATUSES[Math.floor(Math.random() * STATUSES.length)], updatedAt: Date.now() } : r,
      );
    });

  /* --- autoplay: gentle stream of updates unless paused ------------------ */
  React.useEffect(() => {
    if (paused || state !== "idle") return;
    const t = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.5) updateRandom();
      else if (roll < 0.78) changeStatus();
      else if (roll < 0.9) addRow();
      else removeRow();
    }, 2200);
    return () => clearInterval(t);
  }, [paused, state]);

  const rowActions = React.useCallback(
    (row: Order) => [
      { id: "expedite", label: `Expedite ${row.ref}`, icon: "Expedite", tone: "active" as const, onSelect: changeStatus },
      { id: "dismiss", label: `Dismiss ${row.ref}`, icon: "✕", onSelect: () => setRows((rs) => rs.filter((r) => r.id !== row.id)) },
    ],
    [],
  );

  return (
    <div className="flex w-full max-w-[840px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {!paused && state === "idle" ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-70 motion-reduce:hidden" />
            ) : null}
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: paused || state !== "idle" ? "var(--color-muted)" : "var(--color-success)" }} />
          </span>
          <span className="text-[13px] font-semibold text-[var(--color-fg)]">Order processing</span>
          <span className="text-[12px] text-[var(--color-muted)]">{paused ? "paused" : "live"}</span>
        </div>
      </div>

      <StreamingDataRows<Order>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        sort={sort}
        onSortChange={setSort}
        paused={paused}
        state={state}
        onRetry={reset}
        rowActions={rowActions}
        caption="Live order-processing queue. Sort by any column; rows animate as they update."
        renderMobileRow={(r, { actions }) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] text-[var(--color-muted)]">{r.ref}</span>
              <StatusPill status={r.status} />
            </div>
            <span className="text-[14px] font-medium text-[var(--color-fg)]">{r.customer}</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-semibold tabular-nums text-[var(--color-fg)]">
                {formatNumber(r.amount, { currency: "USD", minimumFractionDigits: 2 })}
              </span>
              {actions}
            </div>
          </div>
        )}
      />

      {/* All working controls kept at the BOTTOM for a consistent showcase layout. */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <Ctrl onClick={addRow}>Add row</Ctrl>
        <Ctrl onClick={updateRandom}>Update value</Ctrl>
        <Ctrl onClick={changeStatus}>Change status</Ctrl>
        <Ctrl onClick={removeRow}>Remove row</Ctrl>
        <Ctrl onClick={() => setPaused((p) => !p)} pressed={paused}>{paused ? "Resume" : "Pause"}</Ctrl>
        <Ctrl onClick={reset}>Reset</Ctrl>
        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-[12px] text-[var(--color-muted)] sm:block">Demo data - fictional orders.</p>
          <div className="flex overflow-hidden rounded-md border border-[var(--color-border)] text-[12px]">
            {(["idle", "loading", "error"] as const).map((st) => (
              <button
                key={st}
                type="button"
                aria-pressed={state === st}
                onClick={() => setState(st)}
                className={`px-2.5 py-1 capitalize ${state === st ? "bg-[var(--color-surface)] text-[var(--color-fg)]" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Ctrl({ children, onClick, pressed }: { children: React.ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
        pressed
          ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
      }`}
    >
      {children}
    </button>
  );
}
