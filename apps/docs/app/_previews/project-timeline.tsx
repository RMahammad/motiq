"use client";

import * as React from "react";

import {
  ProjectTimeline,
  type TimelineItem,
  type TimelineGroup,
  type TimelineScale,
  type TimelineMode,
} from "@/registry/productivity/project-timeline";

/* Clearly fictional demo — a made-up application-launch roadmap for an imaginary
 * company ("Northwind"). The PREVIEW is the "app": it owns the items, their
 * dates, statuses, dependency validation, and persistence (a simulated async
 * move/resize that can be made to fail). The component owns only the time-scaled
 * visualization + reading/editing UX.
 *
 * Everything is DETERMINISTIC: dates are fixed ISO-string constants and the
 * current-date marker comes from a fixed `TODAY` constant — there is no
 * Date.now() / new Date() for "now", no Math.random, no clock read at render, so
 * there is no SSR/CSR drift. New state is only produced inside handlers.
 *
 * The control buttons drive the *real* component paths — they dispatch real
 * clicks/keystrokes on the real bars, headers, and detail buttons — so what you
 * click is what a user would do. */

const TODAY = "2026-07-14";

const GROUPS: TimelineGroup[] = [
  { id: "discovery", name: "Discovery" },
  { id: "build", name: "Build" },
  { id: "launch", name: "Launch" },
];

function seed(): TimelineItem[] {
  return [
    { id: "kickoff", title: "Kickoff", type: "milestone", group: "discovery", startDate: "2026-05-04", endDate: "2026-05-04", status: "completed", milestone: true },
    { id: "research", title: "User research", type: "task", group: "discovery", startDate: "2026-05-05", endDate: "2026-05-22", status: "completed", progress: 1, assignee: "Priya" },
    { id: "spec", title: "Product spec", type: "phase", group: "discovery", startDate: "2026-05-18", endDate: "2026-06-12", status: "completed", progress: 1, dependencyIds: ["research"] },
    { id: "design", title: "Design system", type: "phase", group: "build", startDate: "2026-06-08", endDate: "2026-07-10", status: "active", progress: 0.75, dependencyIds: ["spec"], assignee: "Marco", priority: "high" },
    { id: "api", title: "Platform API", type: "phase", group: "build", startDate: "2026-06-15", endDate: "2026-08-01", status: "active", progress: 0.4, dependencyIds: ["spec"] },
    { id: "app", title: "App build", type: "phase", group: "build", startDate: "2026-07-06", endDate: "2026-08-20", status: "blocked", dependencyIds: ["design", "api"], metadata: { note: "Waiting on design-system sign-off." } },
    { id: "beta", title: "Private beta", type: "release", group: "launch", startDate: "2026-08-24", endDate: "2026-08-24", status: "planned", milestone: true, dependencyIds: ["app"] },
    { id: "marketing", title: "Marketing site", type: "task", group: "launch", startDate: "2026-07-20", endDate: "2026-08-18", status: "delayed", dependencyIds: ["design"], metadata: { note: "Copywriting slipped two weeks." }, priority: "urgent" },
    { id: "ga", title: "General availability", type: "milestone", group: "launch", startDate: "2026-09-07", endDate: "2026-09-07", status: "planned", milestone: true, dependencyIds: ["beta", "marketing"] },
  ];
}

const raf = () =>
  new Promise<void>((r) => (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(() => r()) : setTimeout(r, 16)));

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function ProjectTimelinePreview() {
  const [items, setItems] = React.useState<TimelineItem[]>(seed);
  const [scale, setScale] = React.useState<TimelineScale>("week");
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>("app");
  const [mode, setMode] = React.useState<TimelineMode>("timeline");
  const [failNext, setFailNext] = React.useState(false);
  const [note, setNote] = React.useState("Pick a scale, select an item, or jump to today. Every path is keyboard-accessible.");

  const failRef = React.useRef(false);
  failRef.current = failNext;
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  /* -- app-owned persistence for move/resize (rejects once when armed) - */
  const persistDates = React.useCallback(
    (id: string, startMs: number, endMs: number) =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (failRef.current) {
            failRef.current = false;
            setFailNext(false);
            reject(new Error("Simulated save failure — dates reverted."));
            return;
          }
          setItems((prev) => prev.map((t) => (t.id === id ? { ...t, startDate: startMs, endDate: endMs } : t)));
          resolve();
        }, 380);
      }),
    [],
  );

  /* -- controls that drive the real component UI --------------------- */

  const clickBar = React.useCallback((id: string) => {
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-timeline-item="${id}"], [data-timeline-row="${id}"]`)?.click();
  }, []);

  const demoScale = React.useCallback(() => {
    setScale((s) => {
      const next: TimelineScale = s === "week" ? "day" : s === "day" ? "month" : "week";
      setNote(`Changed scale to “${next}”. The whole axis re-projects — the selected item stays in view.`);
      return next;
    });
  }, []);

  const demoToday = React.useCallback(async () => {
    setScale("week");
    setNote("Jumped to today’s marker (Jul 14). The current-date line is fixed data, not the clock.");
    await raf();
    const btn = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []).find((b) => b.textContent?.trim() === "Today");
    btn?.click();
  }, []);

  const demoSelect = React.useCallback(() => {
    setNote("Selected “App build” — its dependencies (Design system, Platform API) connect into it.");
    clickBar("app");
  }, [clickBar]);

  const demoMilestone = React.useCallback(() => {
    setNote("Inspected the “General availability” milestone — its date and prerequisites are shown as text.");
    clickBar("ga");
  }, [clickBar]);

  const demoComplete = React.useCallback(() => {
    setNote("Completed “Design system”. “App build” is no longer waiting on it.");
    setItems((prev) => prev.map((t) => (t.id === "design" ? { ...t, status: "completed", progress: 1 } : t)));
  }, []);

  const demoDelay = React.useCallback(() => {
    setSelectedItemId("api");
    setNote("Marked “Platform API” delayed with a reason — downstream work inherits the risk.");
    setItems((prev) => prev.map((t) => (t.id === "api" ? { ...t, status: "delayed", metadata: { note: "Vendor integration pushed a sprint." } } : t)));
  }, []);

  const demoBlock = React.useCallback(() => {
    setSelectedItemId("marketing");
    setNote("Blocked “Marketing site” pending brand approval.");
    setItems((prev) => prev.map((t) => (t.id === "marketing" ? { ...t, status: "blocked", metadata: { note: "Brand approval pending." } } : t)));
  }, []);

  const demoCollapse = React.useCallback(async () => {
    setMode("timeline");
    setNote("Collapsed the “Launch” phase to focus on upstream build work.");
    await raf();
    const btn = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []).find(
      (b) => b.getAttribute("aria-expanded") === "true" && b.textContent?.includes("Launch"),
    );
    btn?.click();
  }, []);

  const demoMode = React.useCallback(() => {
    setMode((m) => (m === "timeline" ? "list" : "timeline"));
    setNote((_n) => (mode === "timeline" ? "Switched to the compact list view (also the mobile mode) — full dates as text." : "Switched back to the timeline."));
  }, [mode]);

  const demoMove = React.useCallback(async () => {
    setSelectedItemId("marketing");
    setNote("Moved “Marketing site” one week later from the detail panel — an accessible, non-drag reschedule.");
    await raf();
    const btn = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []).find((b) => b.textContent?.includes("Move later"));
    btn?.click();
  }, []);

  const demoFailure = React.useCallback(async () => {
    setFailNext(true);
    failRef.current = true;
    setSelectedItemId("app");
    setNote("Armed a save failure, then extended “App build” — watch the optimistic bar snap back on rejection.");
    await raf();
    const btn = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []).find((b) => b.textContent?.includes("Extend"));
    btn?.click();
  }, []);

  const reset = React.useCallback(() => {
    setItems(seed());
    setScale("week");
    setSelectedItemId("app");
    setMode("timeline");
    setFailNext(false);
    failRef.current = false;
    setNote("Reset. Pick a scale, select an item, or jump to today.");
  }, []);

  return (
    <div className="flex w-full max-w-[1000px] flex-col gap-4">
      {/* roadmap shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Northwind · Application launch roadmap
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">May – Sep · timeline view</span>
        </div>

        <div ref={rootRef} className="p-3">
          <ProjectTimeline
            items={items}
            groups={GROUPS}
            today={TODAY}
            scale={scale}
            onScaleChange={setScale}
            selectedItemId={selectedItemId}
            onSelectedItemChange={setSelectedItemId}
            mode={mode}
            onModeChange={setMode}
            onMove={persistDates}
            onResize={persistDates}
            label="Northwind launch roadmap"
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={demoScale}>Change scale</button>
        <button type="button" className={control} onClick={demoToday}>Jump to today</button>
        <button type="button" className={control} onClick={demoSelect}>Select item</button>
        <button type="button" className={control} onClick={demoMilestone}>Inspect milestone</button>
        <button type="button" className={control} onClick={demoComplete}>Complete item</button>
        <button type="button" className={control} onClick={demoDelay}>Delay item</button>
        <button type="button" className={control} onClick={demoBlock}>Block item</button>
        <button type="button" className={control} onClick={demoCollapse}>Collapse phase</button>
        <button type="button" className={control} onClick={demoMode}>Switch list/timeline</button>
        <button type="button" className={control} onClick={demoMove}>Reschedule (move)</button>
        <button type="button" className={control} onClick={demoFailure}>Optimistic resize + rollback</button>
        <button type="button" className={control} onClick={reset}>Reset</button>
        <span aria-live="polite" className="ml-auto max-w-[360px] text-right text-[12px] text-[var(--color-muted)]">
          {note}
        </span>
      </div>
    </div>
  );
}

export default ProjectTimelinePreview;
