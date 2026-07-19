"use client";

import * as React from "react";

import { QueuePulseLanes, type LaneData } from "@/registry/backgrounds/queue-pulse-lanes";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

const LANES: LaneData[] = [
  { id: "webhooks", label: "webhooks", queued: 4, active: 3, completed: 46, capacity: 14, throughput: 9 },
  { id: "image-resize", label: "image-resize", queued: 23, active: 6, completed: 31, capacity: 24, throughput: 5 },
  { id: "email-digest", label: "email-digest", queued: 9, active: 0, completed: 17, capacity: 12, blocked: true },
  { id: "csv-import", label: "csv-import", queued: 6, active: 2, completed: 20, capacity: 11, delayed: true, throughput: 3 },
  { id: "thumbnails", label: "thumbnails", queued: 1, active: 1, completed: 88, capacity: 10, throughput: 7 },
];

/**
 * Compact catalog adapter (docs/55 §7). Field-forward: one short caption, the
 * live lanes filling the rest — left-centered on desktop, top on mobile with the
 * lanes vivid below. No controls — the detail page owns the playground.
 */
export function QueuePulseLanesCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <QueuePulseLanes lanes={LANES} contentPlacement={placement} intensity={1.45} density={1.3} safeAreaStrength={0.38} className="h-full w-full">
      <CatalogCaption eyebrow="Queue throughput" title="Every queue, moving at its own pace." placement={placement} />
    </QueuePulseLanes>
  );
}

export default QueuePulseLanesCatalogPreview;
