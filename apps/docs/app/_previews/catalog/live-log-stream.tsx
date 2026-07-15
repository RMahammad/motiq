"use client";

import * as React from "react";

import { LiveLogStream, type LogEntry } from "@/registry/developer-tools/live-log-stream";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL LiveLogStream in one
 * representative streaming state — a populated, deterministic deploy log — with
 * no Add/Pause/Clear controls and no preview timer. Timestamps are fixed. The
 * detail page keeps the full live-stream rig.
 */

const BASE_TS = 1_700_000_000_000;

const LINES: Array<Omit<LogEntry, "id" | "timestamp">> = [
  { level: "info", message: "Fetching source · git@vaultwind/ledger#a91f0c2", source: "clone" },
  { level: "success", message: "Installed dependencies in 9.2s", source: "install" },
  { level: "info", message: "Compiling TypeScript (strict)…", source: "build" },
  { level: "warning", message: "Large chunk: vendor.js is 612 KB (gzip 188 KB)", source: "build" },
  { level: "success", message: "Type check passed · 0 errors", source: "build" },
  { level: "info", message: "Uploading build to edge network (6 regions)", source: "deploy" },
  { level: "error", message: "Health check failed on cdg1 (503) — retrying", source: "deploy" },
  { level: "success", message: "All regions healthy · deployed to production", source: "deploy" },
];

const ENTRIES: LogEntry[] = LINES.map((l, i) => ({
  ...l,
  id: `log-${i + 1}`,
  timestamp: BASE_TS + i * 1500,
}));

export function LiveLogStreamCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <LiveLogStream
        entries={ENTRIES}
        status="streaming"
        title="Deploy · vaultwind/ledger"
        className="[--log-height:16rem]"
      />
    </div>
  );
}

export default LiveLogStreamCatalogPreview;
