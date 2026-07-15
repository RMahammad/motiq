"use client";

import * as React from "react";

import {
  StreamingDataRows,
  StatusPill,
  type Column,
} from "@/registry/data/streaming-data-rows";
import { formatNumber, formatTimestamp } from "@/lib/motionkit";

/**
 * Compact catalog adapter (docs/55 §7). A settled, sorted live table — no
 * Add/Update/Pause/Reset controls, no autoplay stream. Deterministic module-scope
 * rows so server + first client render match. Trimmed to 5 rows.
 */

interface Order {
  id: string;
  ref: string;
  customer: string;
  amount: number;
  status: string;
  updatedAt: number;
}

const BASE_TS = 1_700_000_000_000;
const ROWS: Order[] = [
  { id: "ord_1042", ref: "#1042", customer: "Vireo Analytics", amount: 428.5, status: "active", updatedAt: BASE_TS + 4000 },
  { id: "ord_1043", ref: "#1043", customer: "Solstice Foods", amount: 91.2, status: "queued", updatedAt: BASE_TS + 3000 },
  { id: "ord_1044", ref: "#1044", customer: "Ninefold Studio", amount: 764, status: "completed", updatedAt: BASE_TS + 2000 },
  { id: "ord_1045", ref: "#1045", customer: "Tidewater Optics", amount: 312.75, status: "waiting", updatedAt: BASE_TS + 1000 },
  { id: "ord_1046", ref: "#1046", customer: "Basalt Interiors", amount: 559.9, status: "failed", updatedAt: BASE_TS },
];

export function StreamingDataRowsCatalogPreview() {
  const columns = React.useMemo<Column<Order>[]>(
    () => [
      {
        key: "ref",
        header: "Order",
        value: (r) => r.ref,
        render: (r) => <span className="font-mono text-[12.5px] text-[var(--color-muted)]">{r.ref}</span>,
      },
      {
        key: "customer",
        header: "Customer",
        value: (r) => r.customer,
        render: (r) => <span className="font-medium text-[var(--color-fg)]">{r.customer}</span>,
      },
      {
        key: "amount",
        header: "Amount",
        align: "end",
        numeric: true,
        value: (r) => r.amount,
        format: (n) => formatNumber(n, { currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        key: "status",
        header: "Status",
        value: (r) => r.status,
        render: (r) => <StatusPill status={r.status} />,
      },
      {
        key: "updatedAt",
        header: "Updated",
        align: "end",
        value: (r) => r.updatedAt,
        render: (r) => (
          <span className="text-[12.5px] text-[var(--color-muted)] tabular-nums">
            {formatTimestamp(r.updatedAt, {
              format: (d) =>
                new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d),
            })}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <StreamingDataRows<Order>
        rows={ROWS}
        columns={columns}
        getRowId={(r) => r.id}
        sort={{ key: "updatedAt", dir: "desc" }}
        caption="Live order-processing queue."
      />
    </div>
  );
}

export default StreamingDataRowsCatalogPreview;
