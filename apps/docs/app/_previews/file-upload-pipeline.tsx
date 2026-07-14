"use client";

import * as React from "react";

import {
  FileUploadPipeline,
  type UploadItem,
} from "@/registry/file/file-upload-pipeline";

/* Clearly fictional demo — an upload panel inside an imaginary "Nimbus Drive"
 * file manager. No real files, people, or storage. The APP (this preview) owns
 * the upload lifecycle: a deterministic, SEEDED local interval advances progress
 * (no Math.random, no per-frame React churn — ~2 ticks/second), transitions
 * uploading → processing → completed, and the controls drive the exact same
 * callbacks the real component exposes. The component itself never uploads. */

const MB = 1_000_000;

// A tiny self-contained SVG thumbnail (data URI) so the image row shows the
// thumbnail path without loading any external asset.
const THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><rect width='44' height='44' fill='%237c6cf6'/><path d='M6 34l10-10 6 6 8-9 8 13z' fill='%23fff' opacity='.85'/><circle cx='14' cy='13' r='4' fill='%23ffe08a'/></svg>",
  );

function seedItems(): UploadItem[] {
  return [
    {
      id: "s-hero",
      fileName: "aurora-hero-banner.png",
      fileType: "image/png",
      fileSize: 4.2 * MB,
      progress: 34,
      status: "uploading",
      speed: 1.8 * MB,
      remainingTime: 6,
      thumbnail: THUMB,
      metadata: { Dimensions: "2400 × 1200", "Color profile": "sRGB" },
    },
    {
      id: "s-deck",
      fileName: "launch-deck.pdf",
      fileType: "application/pdf",
      fileSize: 8.7 * MB,
      progress: 0,
      status: "queued",
      metadata: { Pages: 42 },
    },
    {
      id: "s-promo",
      fileName: "promo-cut.mov",
      fileType: "video/quicktime",
      fileSize: 96 * MB,
      progress: 61,
      status: "processing",
      processingStage: "Transcoding to H.264",
      metadata: { Duration: "0:38", Resolution: "1080p" },
    },
    {
      id: "s-brand",
      fileName: "brand-kit.zip",
      fileType: "application/zip",
      fileSize: 22 * MB,
      progress: 100,
      status: "completed",
    },
    {
      id: "s-raw",
      fileName: "field-recording.wav",
      fileType: "audio/wav",
      fileSize: 130 * MB,
      progress: 71,
      status: "failed",
      error: "Upload exceeded the 100 MB plan limit.",
      retryCount: 1,
    },
  ];
}

const NEW_NAMES = [
  { fileName: "moodboard.jpg", fileType: "image/jpeg", fileSize: 3.1 * MB },
  { fileName: "release-notes.md", fileType: "text/markdown", fileSize: 0.02 * MB },
  { fileName: "teaser.mp4", fileType: "video/mp4", fileSize: 54 * MB },
  { fileName: "logo-pack.zip", fileType: "application/zip", fileSize: 11 * MB },
];

/* Deterministic pseudo-random step from a numeric seed (LCG) — no Math.random. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function seededStep(seed: number): number {
  const x = (seed * 1103515245 + 12345) & 0x7fffffff;
  return 4 + (x % 7); // 4..10 per tick
}

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function FileUploadPipelinePreview() {
  const [items, setItems] = React.useState<UploadItem[]>(seedItems);
  const [offline, setOffline] = React.useState(false);
  const tickRef = React.useRef(0);
  const idRef = React.useRef(0);
  const nameRef = React.useRef(0);

  // Seeded interval owned by the app — advances the transfer deterministically.
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      setItems((prev) =>
        prev.map((it) => {
          if (it.status === "uploading") {
            const step = seededStep(hashId(it.id) + tick);
            const next = it.progress + step;
            if (next >= 100) {
              return { ...it, progress: 0, status: "processing", processingStage: "Scanning & indexing", speed: undefined, remainingTime: undefined };
            }
            return {
              ...it,
              progress: next,
              speed: Math.round((it.fileSize * step) / 100 * 2),
              remainingTime: Math.max(1, Math.round(((100 - next) / step) * 0.5)),
            };
          }
          if (it.status === "processing") {
            const step = seededStep(hashId(it.id) + tick) * 1.5;
            const next = it.progress + step;
            if (next >= 100) return { ...it, progress: 100, status: "completed", processingStage: undefined };
            return { ...it, progress: next };
          }
          return it;
        }),
      );
    }, 480);
    return () => window.clearInterval(timer);
  }, []);

  const mapActive = (fn: (it: UploadItem) => UploadItem, when: (it: UploadItem) => boolean) =>
    setItems((prev) => prev.map((it) => (when(it) ? fn(it) : it)));

  /* per-item callbacks the real component fires ------------------------- */
  const pause = (item: UploadItem) => mapActive((it) => ({ ...it, status: "paused" }), (it) => it.id === item.id);
  const resume = (item: UploadItem) =>
    mapActive((it) => ({ ...it, status: "uploading" }), (it) => it.id === item.id);
  const retry = (item: UploadItem) =>
    mapActive((it) => ({ ...it, status: "uploading", error: undefined, retryCount: (it.retryCount ?? 0) + 1, progress: 0 }), (it) => it.id === item.id);
  const cancel = (item: UploadItem) =>
    mapActive((it) => ({ ...it, status: "cancelled", speed: undefined, remainingTime: undefined }), (it) => it.id === item.id);
  const remove = (item: UploadItem) => setItems((prev) => prev.filter((it) => it.id !== item.id));
  const clearCompleted = () => setItems((prev) => prev.filter((it) => it.status !== "completed"));
  const reorder = (from: number, to: number) =>
    setItems((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Real <input>/drop integration point.
  const addFiles = (files: File[]) =>
    setItems((prev) => [
      ...prev,
      ...files.map((f): UploadItem => {
        idRef.current += 1;
        return {
          id: `upload-${idRef.current}`,
          fileName: f.name,
          fileType: f.type || "application/octet-stream",
          fileSize: f.size,
          progress: 0,
          status: "queued",
        };
      }),
    ]);

  /* demo control shims -------------------------------------------------- */
  const addSample = () => {
    const preset = NEW_NAMES[nameRef.current % NEW_NAMES.length];
    nameRef.current += 1;
    idRef.current += 1;
    setItems((prev) => [...prev, { id: `upload-${idRef.current}`, progress: 0, status: "queued", ...preset }]);
  };
  const startAll = () => mapActive((it) => ({ ...it, status: "uploading", progress: it.progress || 0 }), (it) => it.status === "queued");
  const pauseAll = () => mapActive((it) => ({ ...it, status: "paused" }), (it) => it.status === "uploading");
  const resumeAll = () => mapActive((it) => ({ ...it, status: "uploading" }), (it) => it.status === "paused");
  const failOne = () =>
    setItems((prev) => {
      const target = prev.find((it) => it.status === "uploading" || it.status === "processing");
      if (!target) return prev;
      return prev.map((it) =>
        it.id === target.id
          ? { ...it, status: "failed", error: "Simulated network error — connection reset.", speed: undefined, remainingTime: undefined }
          : it,
      );
    });
  const retryAll = () => mapActive((it) => ({ ...it, status: "uploading", error: undefined, retryCount: (it.retryCount ?? 0) + 1, progress: 0 }), (it) => it.status === "failed");
  const completeAll = () =>
    mapActive(
      (it) => ({ ...it, status: "completed", progress: 100, speed: undefined, remainingTime: undefined, processingStage: undefined }),
      (it) => it.status !== "completed" && it.status !== "cancelled" && it.status !== "failed",
    );
  const cancelAll = () =>
    mapActive(
      (it) => ({ ...it, status: "cancelled", speed: undefined, remainingTime: undefined }),
      (it) => it.status === "uploading" || it.status === "paused" || it.status === "queued" || it.status === "processing",
    );
  const reset = () => {
    tickRef.current = 0;
    idRef.current = 0;
    nameRef.current = 0;
    setOffline(false);
    setItems(seedItems());
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-4">
      {/* fictional file-manager shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="grid h-5 w-5 place-items-center rounded-md bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-accent-foreground,white)]">N</span>
            Nimbus Drive
          </span>
          <span aria-hidden className="text-[12px] text-[var(--color-muted)]">My files / Marketing</span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)] tabular-nums">18.4 / 100 GB</span>
        </div>

        <div className="p-3">
          <FileUploadPipeline
            items={items}
            title="Uploading to Marketing"
            label="Nimbus Drive upload pipeline"
            accept="image/*,video/*,application/pdf,.zip"
            offline={offline}
            onAddFiles={addFiles}
            onPause={pause}
            onResume={resume}
            onRetry={retry}
            onCancel={cancel}
            onRemove={remove}
            onClearCompleted={clearCompleted}
            onReorder={reorder}
            onCopyError={() => {}}
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addSample}>Add files</button>
        <button type="button" className={control} onClick={startAll}>Start</button>
        <button type="button" className={control} onClick={pauseAll}>Pause</button>
        <button type="button" className={control} onClick={resumeAll}>Resume</button>
        <button type="button" className={control} onClick={failOne}>Fail item</button>
        <button type="button" className={control} onClick={retryAll}>Retry</button>
        <button type="button" className={control} onClick={completeAll}>Complete</button>
        <button type="button" className={control} onClick={cancelAll}>Cancel</button>
        <button type="button" className={control} aria-pressed={offline} onClick={() => setOffline((o) => !o)}>
          {offline ? "Offline: on" : "Offline: off"}
        </button>
        <button type="button" className={control} onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

export default FileUploadPipelinePreview;
