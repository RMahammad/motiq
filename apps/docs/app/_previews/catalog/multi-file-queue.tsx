"use client";

import * as React from "react";

import { MultiFileQueue, type QueueItem } from "@/registry/file/multi-file-queue";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL MultiFileQueue in one
 * representative snapshot — priority lanes with active, blocked, and completed
 * items, plus the slot indicator + queue progress. No external add/start/fail
 * demo controls; the panel is static. Trimmed to 4 files across two lanes.
 * Deterministic.
 */

const ITEMS: QueueItem[] = [
  { id: "hero", fileName: "opening-reel-master.mp4", fileType: "video/mp4", fileSize: 1_240_000_000, priority: "high", status: "active", progress: 58, speed: 24_600_000, remainingTime: 41, destination: "Media library / Keynote 2026" },
  { id: "derived", fileName: "captions-burned.mp4", fileType: "video/mp4", fileSize: 540_000_000, priority: "high", status: "blocked", progress: 0, dependency: "opening-reel-master.mp4 to finish", destination: "Media library / Keynote 2026" },
  { id: "photos", fileName: "event-photos.zip", fileType: "application/zip", fileSize: 96_700_000, priority: "normal", status: "paused", progress: 34, destination: "Media library / Gallery" },
  { id: "archive", fileName: "2025-recap.tar.gz", fileType: "application/gzip", fileSize: 384_000_000, priority: "normal", status: "completed", progress: 100, destination: "Archive / 2025" },
];

export function MultiFileQueueCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <MultiFileQueue items={ITEMS} concurrency={2} title="Import queue" label="Multi-file queue" />
    </div>
  );
}

export default MultiFileQueueCatalogPreview;
