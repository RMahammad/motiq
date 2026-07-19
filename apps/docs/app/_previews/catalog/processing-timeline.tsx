"use client";

import * as React from "react";

import { ProcessingTimeline, type ProcessingStage } from "@/registry/file/processing-timeline";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ProcessingTimeline in
 * one representative mid-pipeline state — two stages completed, one processing
 * (with app-supplied progress + "Current stage"), two pending. No external
 * start/advance/fail demo controls. Trimmed to 5 stages. Deterministic
 * timestamps.
 */

const T0 = 1_720_000_000_000;

const STAGES: ProcessingStage[] = [
  { id: "ingest", label: "Upload received", description: "Persist the source file and register the job.", status: "completed", startTime: T0, duration: 900 },
  { id: "scan", label: "Virus scan", description: "Scan the source against the signature database.", status: "completed", startTime: T0 + 1_100, duration: 2_100 },
  { id: "transcode", label: "Transcoding", description: "Produce adaptive renditions (1080p, 720p, 480p).", status: "active", startTime: T0 + 3_300, progress: 46 },
  { id: "thumbnail", label: "Thumbnail generation", description: "Sample keyframes and pick a poster frame.", status: "pending" },
  { id: "publish", label: "Publishing", description: "Attach renditions and expose to the CDN.", status: "pending" },
];

export function ProcessingTimelineCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ProcessingTimeline
        title="product-launch-v3.mp4"
        subtitle="MP4 · 175.8 MB · Marketing / Q3 launch"
        stages={STAGES}
        currentStageId="transcode"
      />
    </div>
  );
}

export default ProcessingTimelineCatalogPreview;
