"use client";

import * as React from "react";

import { CopperplateHatch } from "@/registry/backgrounds/copperplate-hatch";

/**
 * Compact catalog adapter. Renders the REAL CopperplateHatch FULL-BLEED - edge
 * to edge in the ambient stage - with a concise hero overlaid on its readable
 * safe area. No demo controls or inner frame (the detail page owns the
 * interactive playground). Deterministic; sized to the ambient stage.
 */
export function CopperplateHatchCatalogPreview() {
  return (
    <CopperplateHatch
      density={1}
      focalPoint={[{ x: 0.7, y: 0.32 }]}
      safeArea={{ x: 0.03, y: 0.08, w: 0.52, h: 0.84 }}
      className="h-full w-full"
    >
      {/* Component commits to a fixed dark palette (Motion Lab), so the compact
          hero uses the lab's own fixed light colors + text-shadow, not theme tokens. */}
      <div className="flex h-full flex-col justify-center px-7 py-6 sm:px-9">
        <span
          className="mb-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px] backdrop-blur-[8px]"
          style={{ border: "1px solid #232636", background: "rgba(10,11,16,0.55)", color: "#8f95ab" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#eab365" }} /> Ambient background
        </span>
        <h2
          className="max-w-[15ch] text-[clamp(1.5rem,3.2vw,2.25rem)] font-extrabold leading-[1.08] tracking-tight"
          style={{ color: "#eceef8", textShadow: "0 2px 26px rgba(10,11,16,0.95), 0 0 3px rgba(10,11,16,0.7)" }}
        >
          Shading built from strokes, not gradients.
        </h2>
        <p
          className="mt-2.5 max-w-[38ch] text-[13.5px] leading-relaxed"
          style={{ color: "#b7bccf", textShadow: "0 1px 18px rgba(10,11,16,0.95)" }}
        >
          Crosshatched ink accumulates tone around your focal point and thins to blank paper behind your headline.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span
            className="rounded-[10px] px-3.5 py-2 text-[13px] font-bold"
            style={{ background: "#eab365", color: "#0a0b10" }}
          >
            Get started
          </span>
          <span
            className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold backdrop-blur-[8px]"
            style={{ border: "1px solid #232636", background: "rgba(10,11,16,0.5)", color: "#eceef8" }}
          >
            View docs
          </span>
        </div>
      </div>
    </CopperplateHatch>
  );
}

export default CopperplateHatchCatalogPreview;
