"use client";

import * as React from "react";

import {
  MultiFileQueue,
  type QueueItem,
  type QueuePriority,
  type QueueStatus,
} from "@/registry/file/multi-file-queue";

/* Clearly fictional demo — a batch media-import job for an imaginary asset
 * library. No real files, people, or storage. Fixed ids + sizes so there is no
 * SSR/CSR hydration drift; nothing random or time-based is read at render. The
 * app (this preview) owns the queue data + scheduler; the component only renders
 * the items and emits intent callbacks. It never imports/uploads anything. */

const CONCURRENCY = 2;

// A small deterministic pool of fictional assets used when "Add files" is
// pressed. Cycled by an incrementing ref — no randomness.
const POOL: Array<{ fileName: string; fileType: string; fileSize: number; priority: QueuePriority }> = [
  { fileName: "keynote-stage-4k.mov", fileType: "video/quicktime", fileSize: 812_400_000, priority: "high" },
  { fileName: "press-kit.zip", fileType: "application/zip", fileSize: 46_200_000, priority: "normal" },
  { fileName: "booth-panorama.tiff", fileType: "image/tiff", fileSize: 128_500_000, priority: "normal" },
  { fileName: "voiceover-take-3.wav", fileType: "audio/wav", fileSize: 61_900_000, priority: "low" },
  { fileName: "sponsor-logos.pdf", fileType: "application/pdf", fileSize: 3_400_000, priority: "low" },
];

function seed(): QueueItem[] {
  return [
    {
      id: "q-hero",
      fileName: "opening-reel-master.mp4",
      fileType: "video/mp4",
      fileSize: 1_240_000_000,
      priority: "high",
      status: "active",
      progress: 58,
      speed: 24_600_000,
      remainingTime: 41,
      destination: "Media library / Keynote 2026",
    },
    {
      id: "q-thumb",
      fileName: "thumbnail-set.png",
      fileType: "image/png",
      fileSize: 8_800_000,
      priority: "high",
      status: "active",
      progress: 91,
      speed: 12_100_000,
      remainingTime: 3,
      destination: "Media library / Keynote 2026",
    },
    {
      id: "q-derived",
      fileName: "captions-burned.mp4",
      fileType: "video/mp4",
      fileSize: 540_000_000,
      priority: "high",
      status: "blocked",
      progress: 0,
      dependency: "opening-reel-master.mp4 to finish",
      destination: "Media library / Keynote 2026",
    },
    {
      id: "q-deck",
      fileName: "investor-deck.pdf",
      fileType: "application/pdf",
      fileSize: 22_400_000,
      priority: "normal",
      status: "waiting",
      progress: 0,
      destination: "Documents / Q3",
    },
    {
      id: "q-photos",
      fileName: "event-photos.zip",
      fileType: "application/zip",
      fileSize: 96_700_000,
      priority: "normal",
      status: "paused",
      progress: 34,
      destination: "Media library / Gallery",
    },
    {
      id: "q-scan",
      fileName: "floorplan-scan.tiff",
      fileType: "image/tiff",
      fileSize: 210_000_000,
      priority: "normal",
      status: "failed",
      progress: 0,
      error: "Import rejected: file exceeds the 200 MB TIFF limit for this workspace.",
      retryCount: 1,
      destination: "Media library / Venue",
    },
    {
      id: "q-audio",
      fileName: "ambient-loop.wav",
      fileType: "audio/wav",
      fileSize: 44_100_000,
      priority: "low",
      status: "queued",
      progress: 0,
      destination: "Media library / Audio",
    },
    {
      id: "q-archive",
      fileName: "2025-recap.tar.gz",
      fileType: "application/gzip",
      fileSize: 384_000_000,
      priority: "low",
      status: "completed",
      progress: 100,
      destination: "Archive / 2025",
    },
  ];
}

const RUNNING: ReadonlySet<QueueStatus> = new Set(["active", "processing"]);

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function MultiFileQueuePreview() {
  const [items, setItems] = React.useState<QueueItem[]>(seed);
  const addRef = React.useRef(0);

  const patch = (id: string, next: Partial<QueueItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));

  // -- per-item callbacks (the component emits intent; the app mutates data) --
  const onRemove = (item: QueueItem) => setItems((prev) => prev.filter((it) => it.id !== item.id));
  const onPause = (item: QueueItem) => patch(item.id, { status: "paused" });
  const onResume = (item: QueueItem) => patch(item.id, { status: "active" });
  const onRetry = (item: QueueItem) =>
    patch(item.id, { status: "active", progress: 0, error: undefined, retryCount: (item.retryCount ?? 0) + 1 });
  const onCancel = (item: QueueItem) => patch(item.id, { status: "cancelled", progress: 0 });
  const onReorder = (from: number, to: number) =>
    setItems((prev) => {
      const nextArr = prev.slice();
      const [moved] = nextArr.splice(from, 1);
      nextArr.splice(to, 0, moved);
      return nextArr;
    });
  const onPriorityChange = (item: QueueItem, priority: QueuePriority) => patch(item.id, { priority });

  // -- queue-level callbacks --
  const onPauseAll = () =>
    setItems((prev) => prev.map((it) => (RUNNING.has(it.status) ? { ...it, status: "paused" } : it)));
  const onResumeAll = () =>
    setItems((prev) => prev.map((it) => (it.status === "paused" ? { ...it, status: "active" } : it)));
  const onRetryFailed = () =>
    setItems((prev) =>
      prev.map((it) =>
        it.status === "failed" ? { ...it, status: "active", progress: 0, error: undefined, retryCount: (it.retryCount ?? 0) + 1 } : it,
      ),
    );
  const onClearCompleted = () => setItems((prev) => prev.filter((it) => it.status !== "completed"));

  const onAdd = () => {
    const spec = POOL[addRef.current % POOL.length];
    addRef.current += 1;
    setItems((prev) => [
      ...prev,
      { ...spec, id: `q-add-${addRef.current}`, status: "queued", progress: 0, destination: "Media library / Imports" },
    ]);
  };

  // -- demo controls (drive the same data paths the component's UI does) --
  const firstWith = (pred: (it: QueueItem) => boolean) => items.find(pred);

  const startNext = () => {
    const next = firstWith((it) => it.status === "queued" || it.status === "waiting");
    if (next) patch(next.id, { status: "active", progress: 0, speed: 18_000_000, remainingTime: 30 });
  };
  const pauseActive = () => {
    const a = firstWith((it) => it.status === "active");
    if (a) onPause(a);
  };
  const resumeOne = () => {
    const p = firstWith((it) => it.status === "paused");
    if (p) onResume(p);
  };
  const failItem = () => {
    const a = firstWith((it) => it.status === "active");
    if (a) patch(a.id, { status: "failed", progress: 0, error: "Import failed: connection reset by the storage endpoint." });
  };
  const increasePriority = () => {
    const t = firstWith((it) => (it.status === "queued" || it.status === "waiting" || it.status === "paused") && it.priority !== "high");
    if (t) onPriorityChange(t, t.priority === "low" ? "normal" : "high");
  };
  const reorderDown = () => {
    // Move the first pending item down past the next same-priority pending item.
    const idx = items.findIndex((it) => it.status === "queued" || it.status === "waiting" || it.status === "paused");
    if (idx === -1) return;
    const p = items[idx].priority;
    const nextIdx = items.findIndex(
      (it, i) => i > idx && it.priority === p && (it.status === "queued" || it.status === "waiting" || it.status === "paused"),
    );
    if (nextIdx !== -1) onReorder(idx, nextIdx);
  };
  const completeOne = () => {
    const a = firstWith((it) => it.status === "active");
    if (a) patch(a.id, { status: "completed", progress: 100, speed: undefined, remainingTime: undefined });
  };
  const reset = () => {
    setItems(seed());
    addRef.current = 0;
  };

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-4">
      {/* media-import workspace shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Asset Importer · Batch job
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">{CONCURRENCY} parallel slots</span>
        </div>

        <div className="p-3">
          <MultiFileQueue
            items={items}
            concurrency={CONCURRENCY}
            title="Import queue"
            label="Batch media import queue"
            onAdd={onAdd}
            onRemove={onRemove}
            onPause={onPause}
            onResume={onResume}
            onRetry={onRetry}
            onCancel={onCancel}
            onReorder={onReorder}
            onPriorityChange={onPriorityChange}
            onPauseAll={onPauseAll}
            onResumeAll={onResumeAll}
            onRetryFailed={onRetryFailed}
            onClearCompleted={onClearCompleted}
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={onAdd}>Add files</button>
        <button type="button" className={control} onClick={startNext}>Start next</button>
        <button type="button" className={control} onClick={pauseActive}>Pause active</button>
        <button type="button" className={control} onClick={resumeOne}>Resume</button>
        <button type="button" className={control} onClick={failItem}>Fail item</button>
        <button type="button" className={control} onClick={onRetryFailed}>Retry failed</button>
        <button type="button" className={control} onClick={increasePriority}>Increase priority</button>
        <button type="button" className={control} onClick={reorderDown}>Reorder</button>
        <button type="button" className={control} onClick={completeOne}>Complete item</button>
        <button type="button" className={control} onClick={onClearCompleted}>Clear completed</button>
        <button type="button" className={control} onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

export default MultiFileQueuePreview;
