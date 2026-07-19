"use client";

import * as React from "react";

import { LiveLogStream, type LogEntry, type LogLevel, type LogStreamStatus } from "@/registry/developer-tools/live-log-stream";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview fabricates a build/deploy stream from local,
 * clearly-fictional data — there is no real pipeline here. The component only
 * renders whatever entries + state the application passes it.
 * ---------------------------------------------------------------------- */

// A scripted, fictional deploy run that loops. Realistic shape, invented content.
const SCRIPT: Array<{ level: LogLevel; message: string; source?: string }> = [
  { level: "info", message: "Fetching source · git@vaultwind/ledger#a91f0c2", source: "clone" },
  { level: "debug", message: "resolved 812 modules from lockfile", source: "install" },
  { level: "info", message: "Installing 812 packages…", source: "install" },
  { level: "success", message: "Installed dependencies in 9.2s", source: "install" },
  { level: "info", message: "Compiling TypeScript (strict)…", source: "build" },
  { level: "debug", message: "cache hit ratio 0.87 · 41 files rebuilt", source: "build" },
  { level: "warning", message: "Large chunk: vendor.js is 612 KB (gzip 188 KB)", source: "build" },
  { level: "success", message: "Type check passed · 0 errors", source: "build" },
  { level: "info", message: "Bundling client assets → 2.1 MB gzipped", source: "build" },
  { level: "warning", message: "Deprecated API used in lib/auth.ts:42", source: "lint" },
  { level: "info", message: "Uploading build to edge network (6 regions)", source: "deploy" },
  { level: "debug", message: "worker pid 4821 spawned · region iad1", source: "deploy" },
  { level: "error", message: "Health check failed on cdg1 (503) - retrying", source: "deploy" },
  { level: "success", message: "All regions healthy · deployed to production", source: "deploy" },
];

const POOL: Record<Exclude<LogLevel, "success" | "debug">, string[]> = {
  info: ["Warming cache in 6 regions", "Revalidating 128 static routes", "Streaming logs from worker 3"],
  warning: ["2 peer dependencies unmet", "Slow query: 1.4s on /api/orders", "Memory at 82% on build node"],
  error: ["ESLint: 1 error in cart.ts", "Failed to reach registry (attempt 2/3)", "Build step exited with code 1"],
};

// Fixed base so the initial (server-rendered) entries are deterministic — the
// live stream (client-only, post-mount) uses real time.
const BASE_TS = 1_700_000_000_000;
let counter = 0;
function makeEntry(level: LogLevel, message: string, source?: string, ts?: number): LogEntry {
  counter += 1;
  return { id: `log-${counter}`, level, message, source, timestamp: ts ?? Date.now() };
}

const controlBtn =
  "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]";

export function LiveLogStreamPreview() {
  const [entries, setEntries] = React.useState<LogEntry[]>(() =>
    SCRIPT.slice(0, 4).map((s, i) => makeEntry(s.level, s.message, s.source, BASE_TS + i * 1500)),
  );
  const [paused, setPaused] = React.useState(false);
  const [follow, setFollow] = React.useState(true);
  const [status, setStatus] = React.useState<LogStreamStatus>("streaming");
  const step = React.useRef(4);
  // One deterministic clock: initial entries sit at BASE_TS + i*1500; every
  // subsequent (post-mount) line advances from that same baseline, so the demo
  // never mixes a fixed initial clock with real wall-time.
  const clock = React.useRef(BASE_TS + 4 * 1500);
  const nextTs = React.useCallback(() => {
    clock.current += 1200;
    return clock.current;
  }, []);

  // Auto-generator: append a scripted line on an interval while live.
  React.useEffect(() => {
    if (paused || status !== "streaming") return;
    const timer = setInterval(() => {
      const s = SCRIPT[step.current % SCRIPT.length];
      step.current += 1;
      setEntries((prev) => [...prev, makeEntry(s.level, s.message, s.source, nextTs())]);
    }, 1200);
    return () => clearInterval(timer);
  }, [paused, status, nextTs]);

  const addManual = React.useCallback((level: LogLevel) => {
    const bank = level === "info" ? POOL.info : level === "warning" ? POOL.warning : POOL.error;
    const message = bank[Math.floor(Math.random() * bank.length)];
    setEntries((prev) => [...prev, makeEntry(level, message, level === "error" ? "deploy" : "build", nextTs())]);
    if (level === "error") setStatus("streaming");
  }, [nextTs]);

  return (
    <div className="w-full max-w-[760px]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Demo data · fictional deploy stream
        </span>
      </div>

      <LiveLogStream
        entries={entries}
        status={status}
        paused={paused}
        onPausedChange={setPaused}
        follow={follow}
        onFollowChange={setFollow}
        maxEntries={200}
        title="Deploy · vaultwind/ledger"
        onClear={() => {
          setEntries([]);
          setStatus("idle");
        }}
        className="[--log-height:22rem]"
      />

      {/* Working controls -------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5" role="group" aria-label="Demo controls">
        <button type="button" className={controlBtn} onClick={() => addManual("info")}>Add info</button>
        <button type="button" className={controlBtn} onClick={() => addManual("warning")}>Add warning</button>
        <button type="button" className={controlBtn} onClick={() => addManual("error")}>Add error</button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button type="button" className={controlBtn} onClick={() => setPaused(true)} disabled={paused}>Pause</button>
        <button type="button" className={controlBtn} onClick={() => setPaused(false)} disabled={!paused}>Resume</button>
        <button type="button" className={controlBtn} onClick={() => setFollow((f) => !f)} aria-pressed={follow}>
          {follow ? "Following" : "Follow off"}
        </button>
        <button
          type="button"
          className={controlBtn}
          onClick={() => {
            setEntries([]);
            setStatus("idle");
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default LiveLogStreamPreview;
