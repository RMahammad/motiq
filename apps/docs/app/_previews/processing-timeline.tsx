"use client";

import * as React from "react";

import {
  ProcessingTimeline,
  type ProcessingStage,
  type ProcessingStatus,
} from "@/registry/file/processing-timeline";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview drives a clearly-fictional product-video processing
 * pipeline from local state — nothing is uploaded, scanned, transcoded, or
 * published. The real component only renders whatever `stages` + statuses the
 * application passes it; it never runs a stage, advances progress, or invents
 * an output. The controls below mutate the local pipeline so you can see every
 * state and animation. Deterministic: fixed timestamps, no Math.random /
 * Date.now at render (handlers stamp fixed offsets so re-renders are stable).
 * ---------------------------------------------------------------------- */

// Fixed base timestamp — avoids SSR/CSR hydration drift (no Date.now at render).
const T0 = 1_720_000_000_000;

interface Seed {
  id: string;
  label: string;
  description: string;
  duration: number;
  output?: unknown;
  logs?: string[];
  metadata?: Record<string, string | number>;
  skippable?: boolean;
}

const SEEDS: Seed[] = [
  {
    id: "ingest",
    label: "Upload received",
    description: "Persist the source file and register the processing job.",
    duration: 900,
    output: { assetId: "vid_9f21c", bytes: 184_320_112, container: "mp4" },
    logs: ["received product-launch-v3.mp4 (175.8 MB)", "stored at s3://media/incoming/vid_9f21c"],
    metadata: { Codec: "h264", Resolution: "3840×2160", "Duration": "1m 42s" },
  },
  {
    id: "scan",
    label: "Virus scan",
    description: "Scan the source against the malware signature database.",
    duration: 2_100,
    output: { engine: "clamav 1.2", signatures: 8_641_203, verdict: "clean" },
    logs: ["loaded 8,641,203 signatures", "scan complete - no threats found"],
  },
  {
    id: "transcode",
    label: "Transcoding",
    description: "Produce adaptive renditions (1080p, 720p, 480p).",
    duration: 42_000,
    output: { renditions: ["1080p", "720p", "480p"], hls: "vid_9f21c/master.m3u8" },
    logs: ["1080p ✓  720p ✓  480p ✓", "packaged HLS master playlist"],
    metadata: { Preset: "web-adaptive", "Peak bitrate": "8.4 Mbps" },
  },
  {
    id: "thumbnail",
    label: "Thumbnail generation",
    description: "Sample keyframes and pick a representative poster frame.",
    duration: 3_400,
    output: { frames: 12, poster: "vid_9f21c/poster.jpg" },
    logs: ["sampled 12 candidate frames", "selected frame @ 00:07 as poster"],
  },
  {
    id: "captions",
    label: "Caption extraction",
    description: "Transcribe audio and align caption cues.",
    duration: 9_800,
    skippable: true,
    output: { language: "en", cues: 68, confidence: 0.94 },
    logs: ["detected language: en", "aligned 68 caption cues"],
  },
  {
    id: "publish",
    label: "Publishing",
    description: "Attach renditions to the asset and expose it to the CDN.",
    duration: 1_500,
    output: { url: "https://cdn.example.com/v/vid_9f21c", visibility: "unlisted" },
    logs: ["invalidated CDN cache", "asset is live (unlisted)"],
  },
];

const ORDER = SEEDS.map((s) => s.id);

function makeStage(seed: Seed, status: ProcessingStatus, extra?: Partial<ProcessingStage>): ProcessingStage {
  return {
    id: seed.id,
    label: seed.label,
    description: seed.description,
    status,
    skippable: seed.skippable,
    ...extra,
  };
}

// A "resolved" stage carries its produced output + duration; an active one gets
// a start time and (optionally) app-supplied progress.
function resolveStage(seed: Seed, startAt: number, status: ProcessingStatus = "completed"): ProcessingStage {
  return makeStage(seed, status, {
    startTime: startAt,
    endTime: startAt + seed.duration,
    duration: seed.duration,
    output: status === "completed" || status === "warning" ? seed.output : undefined,
    logs: status === "completed" || status === "warning" ? seed.logs : undefined,
    metadata: seed.metadata,
    attempt: 1,
  });
}

interface Job {
  currentStageId?: string;
  stages: ProcessingStage[];
}

// Mount state: transcoding in progress with the first two stages done.
function initialJob(): Job {
  return {
    currentStageId: "transcode",
    stages: [
      resolveStage(SEEDS[0], T0),
      resolveStage(SEEDS[1], T0 + 1_000),
      makeStage(SEEDS[2], "active", { startTime: T0 + 3_200, progress: 46, attempt: 1 }),
      makeStage(SEEDS[3], "pending"),
      makeStage(SEEDS[4], "pending"),
      makeStage(SEEDS[5], "pending"),
    ],
  };
}

function freshJob(): Job {
  return { currentStageId: "ingest", stages: SEEDS.map((s) => makeStage(s, "pending")) };
}

// Deterministic per-stage start offsets so completed durations stay stable.
function startOffset(index: number): number {
  let acc = T0;
  for (let i = 0; i < index; i++) acc += SEEDS[i].duration + 200;
  return acc;
}

const PROGRESS_STEPS = [15, 35, 60, 85] as const;

const ctrl =
  "inline-flex items-center gap-1.5 rounded-lg [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors outline-none hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] disabled:opacity-45 disabled:hover:border-[var(--color-border)]";

function Btn({ onClick, disabled, children, path }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; path: string }) {
  return (
    <button type="button" className={ctrl} onClick={onClick} disabled={disabled}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d={path} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </button>
  );
}

export function ProcessingTimelinePreview() {
  const [job, setJob] = React.useState<Job>(initialJob);
  const [activeStageId, setActiveStageId] = React.useState<string | undefined>("transcode");
  const [layout, setLayout] = React.useState<"vertical" | "horizontal">("vertical");
  const [compact, setCompact] = React.useState(false);

  const activeIdx = job.stages.findIndex((s) => s.status === "active" || s.status === "paused");
  const activeStage = activeIdx >= 0 ? job.stages[activeIdx] : undefined;
  const failedStage = job.stages.find((s) => s.status === "failed");
  const firstPendingIdx = job.stages.findIndex((s) => s.status === "pending" || s.status === "queued");
  const inFlight = job.stages.some((s) => ["pending", "queued", "active", "paused"].includes(s.status));
  const resolved = job.stages.every((s) =>
    ["completed", "warning", "skipped", "cancelled", "failed"].includes(s.status),
  );

  const start = () =>
    setJob((j) => {
      const idx = j.stages.findIndex((s) => s.status === "pending" || s.status === "queued");
      if (idx === -1) return j;
      const seed = SEEDS[idx];
      return {
        currentStageId: seed.id,
        stages: j.stages.map((s, i) =>
          i === idx ? { ...s, status: "active", startTime: startOffset(idx), progress: 0, attempt: s.attempt ?? 1 } : s,
        ),
      };
    });

  const setProgress = () =>
    setJob((j) => {
      const idx = j.stages.findIndex((s) => s.status === "active");
      if (idx === -1) return j;
      const cur = j.stages[idx].progress ?? 0;
      const next = PROGRESS_STEPS.find((p) => p > cur) ?? 99;
      return { ...j, stages: j.stages.map((s, i) => (i === idx ? { ...s, progress: next } : s)) };
    });

  const advance = () =>
    setJob((j) => {
      const idx = j.stages.findIndex((s) => s.status === "active" || s.status === "paused");
      if (idx === -1) return j;
      const seed = SEEDS[idx];
      const completed: ProcessingStage = {
        ...j.stages[idx],
        status: "completed",
        progress: undefined,
        endTime: startOffset(idx) + seed.duration,
        duration: seed.duration,
        output: seed.output,
        logs: seed.logs,
      };
      const nextIdx = j.stages.findIndex((s, i) => i > idx && (s.status === "pending" || s.status === "queued"));
      const stages = j.stages.map((s, i) => (i === idx ? completed : s));
      if (nextIdx === -1) return { currentStageId: undefined, stages };
      const nextSeed = SEEDS[nextIdx];
      return {
        currentStageId: nextSeed.id,
        stages: stages.map((s, i) =>
          i === nextIdx ? { ...s, status: "active", startTime: startOffset(nextIdx), progress: 0, attempt: s.attempt ?? 1 } : s,
        ),
      };
    });

  const warn = () =>
    setJob((j) => {
      const idx = j.stages.findIndex((s) => s.status === "active" || s.status === "paused");
      if (idx === -1) return j;
      const seed = SEEDS[idx];
      const warned: ProcessingStage = {
        ...j.stages[idx],
        status: "warning",
        progress: undefined,
        endTime: startOffset(idx) + seed.duration,
        duration: seed.duration,
        warning: "Two low-confidence caption cues were auto-corrected. Review before wide release.",
        output: seed.output,
        logs: seed.logs,
      };
      const nextIdx = j.stages.findIndex((s, i) => i > idx && (s.status === "pending" || s.status === "queued"));
      const stages = j.stages.map((s, i) => (i === idx ? warned : s));
      if (nextIdx === -1) return { currentStageId: undefined, stages };
      return {
        currentStageId: SEEDS[nextIdx].id,
        stages: stages.map((s, i) =>
          i === nextIdx ? { ...s, status: "active", startTime: startOffset(nextIdx), progress: 0 } : s,
        ),
      };
    });

  const fail = () =>
    setJob((j) => {
      const idx = j.stages.findIndex((s) => s.status === "active" || s.status === "paused");
      if (idx === -1) return j;
      return {
        currentStageId: j.stages[idx].id,
        stages: j.stages.map((s, i) =>
          i === idx
            ? {
                ...s,
                status: "failed",
                progress: undefined,
                endTime: startOffset(idx) + 1_200,
                error: "Transcoder exited (code 69): unsupported HDR colour primaries in source stream.",
                logs: [...(SEEDS[idx].logs ?? []), "ERROR: bt2020 primaries not supported by web-adaptive preset"],
                attempt: s.attempt ?? 1,
              }
            : s,
        ),
      };
    });

  const retry = (id: string) =>
    setJob((j) => ({
      currentStageId: id,
      stages: j.stages.map((s) =>
        s.id === id
          ? { ...s, status: "active", error: undefined, progress: 0, startTime: startOffset(ORDER.indexOf(id)), attempt: (s.attempt ?? 1) + 1 }
          : s,
      ),
    }));

  const skip = (id: string) =>
    setJob((j) => {
      const idx = ORDER.indexOf(id);
      const skipped = j.stages.map((s) => (s.id === id ? { ...s, status: "skipped" as ProcessingStatus, progress: undefined } : s));
      const nextIdx = skipped.findIndex((s, i) => i > idx && (s.status === "pending" || s.status === "queued"));
      if (nextIdx === -1) return { currentStageId: undefined, stages: skipped };
      return {
        currentStageId: SEEDS[nextIdx].id,
        stages: skipped.map((s, i) =>
          i === nextIdx ? { ...s, status: "active", startTime: startOffset(nextIdx), progress: 0 } : s,
        ),
      };
    });

  const cancel = () =>
    setJob((j) => ({
      currentStageId: undefined,
      stages: j.stages.map((s) =>
        ["pending", "queued", "active", "paused"].includes(s.status)
          ? { ...s, status: "cancelled", progress: undefined }
          : s,
      ),
    }));

  const restart = () => {
    setJob(freshJob());
    setActiveStageId("ingest");
  };

  const displayName = "product-launch-v3.mp4";

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3">
      {/* Working controls — each mutates the fictional pipeline the component renders. */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </span>
          Processing job
        </span>
        <Btn onClick={start} disabled={firstPendingIdx === -1 || !!activeStage} path="M8 5v14l11-7z">Start</Btn>
        <Btn onClick={setProgress} disabled={!activeStage || activeStage.status !== "active"} path="M4 12h10M12 6l6 6-6 6">Set progress</Btn>
        <Btn onClick={advance} disabled={!activeStage} path="m5 13 4 4L19 7">Advance stage</Btn>
        <Btn onClick={warn} disabled={!activeStage} path="M12 3 2.5 20h19L12 3ZM12 10v4M12 17h.01">Warn</Btn>
        <Btn onClick={fail} disabled={!activeStage} path="M6 6l12 12M18 6 6 18">Fail</Btn>
        <Btn onClick={() => failedStage && retry(failedStage.id)} disabled={!failedStage} path="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5">Retry</Btn>
        <Btn onClick={() => activeStage && skip(activeStage.id)} disabled={!activeStage || !SEEDS.find((s) => s.id === activeStage.id)?.skippable} path="M5 5v14l9-7zM17 5v14">Skip</Btn>
        <Btn onClick={cancel} disabled={!inFlight} path="M6 6l12 12M18 6 6 18">Cancel</Btn>
        <Btn onClick={restart} disabled={!resolved} path="M4 12a8 8 0 1 0 2.3-5.6M4 3v4h4">Restart</Btn>

        <span className="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden />
        <Btn onClick={() => setLayout((l) => (l === "vertical" ? "horizontal" : "vertical"))} path="M4 6h16M4 12h16M4 18h16">
          {layout === "vertical" ? "Vertical" : "Horizontal"}
        </Btn>
        <Btn onClick={() => setCompact((c) => !c)} path="M4 9h16M4 15h16">{compact ? "Compact" : "Comfortable"}</Btn>
      </div>

      <ProcessingTimeline
        title={displayName}
        subtitle="MP4 · 175.8 MB · Marketing / Q3 launch"
        stages={job.stages}
        currentStageId={job.currentStageId}
        activeStageId={activeStageId}
        onActiveStageChange={setActiveStageId}
        layout={layout}
        compact={compact}
        onRetryStage={retry}
        onSkipStage={skip}
        onCancel={cancel}
        onRestart={restart}
      />

      <p className="text-center text-[11.5px] text-[var(--color-muted)]">
        Demo data - a clearly-fictional media pipeline driven from local state. No file is uploaded or processed; the
        component only renders the stages it is given.
      </p>
    </div>
  );
}

export default ProcessingTimelinePreview;
