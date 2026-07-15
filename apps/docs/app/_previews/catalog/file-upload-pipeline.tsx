"use client";

import * as React from "react";

import { FileUploadPipeline, type UploadItem } from "@/registry/file/file-upload-pipeline";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL FileUploadPipeline in
 * one representative "in-progress" snapshot — a mix of uploading, processing,
 * completed, and failed rows so the status vocabulary reads at a glance. No drop
 * zone, no external start/pause/fail demo controls; the panel is static.
 * Trimmed to 4 files. Deterministic.
 */

const MB = 1_000_000;

const ITEMS: UploadItem[] = [
  { id: "hero", fileName: "aurora-hero-banner.png", fileType: "image/png", fileSize: 4.2 * MB, progress: 34, status: "uploading", speed: 1.8 * MB, remainingTime: 6 },
  { id: "promo", fileName: "promo-cut.mov", fileType: "video/quicktime", fileSize: 96 * MB, progress: 61, status: "processing", processingStage: "Transcoding to H.264" },
  { id: "brand", fileName: "brand-kit.zip", fileType: "application/zip", fileSize: 22 * MB, progress: 100, status: "completed" },
  { id: "raw", fileName: "field-recording.wav", fileType: "audio/wav", fileSize: 130 * MB, progress: 71, status: "failed", error: "Upload exceeded the 100 MB plan limit.", retryCount: 1 },
];

export function FileUploadPipelineCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <FileUploadPipeline items={ITEMS} title="Uploading to Marketing" label="File upload pipeline" />
    </div>
  );
}

export default FileUploadPipelineCatalogPreview;
