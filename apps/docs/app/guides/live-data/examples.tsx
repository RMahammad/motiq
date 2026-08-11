"use client";

/**
 * The code shown on /guides/live-data, as real code.
 *
 * The page renders these as snippets, and a page can only render strings — which
 * is exactly how documentation drifts from the components it documents. So the
 * snippets are GENERATED from this file by scripts/sync-guide-examples.mjs, and
 * CI re-runs that script with --check. This file is typechecked like any other,
 * so a prop that changes name breaks the build instead of quietly making the
 * guide wrong.
 *
 * Regions are delimited by "#region <id>" / "#endregion" markers.
 * Imports use the CONSUMER paths (@/components/motiq/...) that installed code
 * uses; the tsconfig maps them to the registry sources.
 */

import * as React from "react";

import { AiResponseStream, type ResponseSegment, type StreamState } from "@/components/motiq/ai-response-stream";
import { DataRefreshState, type RefreshState } from "@/components/motiq/data-refresh-state";
import { LiveLogStream, type LogEntry, type LogStreamStatus } from "@/components/motiq/live-log-stream";

// #region streaming
export function AssistantAnswer({ prompt }: { prompt: string }) {
  const [segments, setSegments] = React.useState<ResponseSegment[]>([]);
  const [state, setState] = React.useState<StreamState>("streaming");

  React.useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setSegments([]);
      setState("streaming");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`Chat failed: ${res.status}`);

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          // Append to the LAST text segment rather than pushing a new one, or every
          // chunk becomes its own paragraph.
          setSegments((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.type === "text") next[next.length - 1] = { ...last, text: last.text + value };
            else next.push({ type: "text", text: value });
            return next;
          });
        }
        setState("complete");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setState("error");
      }
    })();

    return () => controller.abort();
  }, [prompt]);

  return (
    <AiResponseStream
      segments={segments}
      state={state}
      onStop={() => setState("stopped")}
      onRetry={() => setSegments([])}
    />
  );
}
// #endregion

// #region subscription
const MAX_ROWS = 500; // an unbounded feed will eventually stall the page

export function DeployLogs({ deploymentId }: { deploymentId: string }) {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [status, setStatus] = React.useState<LogStreamStatus>("idle");

  React.useEffect(() => {
    const source = new EventSource(`/api/deployments/${deploymentId}/logs`);
    setStatus("streaming");

    source.onmessage = (event) => {
      const entry = JSON.parse(event.data) as LogEntry;
      // Append — never rebuild the array from scratch, or every row re-animates.
      setEntries((prev) => [...prev, entry].slice(-MAX_ROWS));
    };
    source.onerror = () => setStatus("error");
    source.addEventListener("done", () => {
      setStatus("completed");
      source.close();
    });

    return () => source.close();
  }, [deploymentId]);

  return <LiveLogStream entries={entries} status={status} />;
}
// #endregion

// #region polling
export function RevenuePanel() {
  const [state, setState] = React.useState<RefreshState>("idle");
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    setState("refreshing");
    try {
      await fetch("/api/revenue").then((r) => r.json());
      setLastUpdated(Date.now());
      setState("success");
    } catch {
      setState("error");
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return <DataRefreshState state={state} label="Revenue" lastUpdated={lastUpdated} onRefresh={refresh} />;
}
// #endregion
