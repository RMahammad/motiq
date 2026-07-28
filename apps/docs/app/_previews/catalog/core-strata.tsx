"use client";

import * as React from "react";

import { CoreStrata } from "@/registry/backgrounds/core-strata";

/** Fixed Motion Lab "Deep Scan" hero colors — see the detail preview for
 *  rationale (the component paints an opaque dark ground; theme tokens
 *  would go invisible in light mode). */
const LAB = {
  ground: "#0a0b10",
  line: "#232636",
  ink: "#eceef8",
  muted: "#8f95ab",
  body: "#b7bccf",
  amber: "#e8a852",
};

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL CoreStrata FULL-BLEED
 * — edge to edge in the ambient stage — with a concise hero overlaid on its
 * readable safe area. No demo controls or inner frame (the detail page owns
 * the interactive playground). Deterministic; sized to the ambient stage.
 */
export function CoreStrataCatalogPreview() {
  return (
    <CoreStrata
      density={1.1}
      faults={3}
      safeArea={{ x: 0.03, y: 0.08, w: 0.52, h: 0.84 }}
      className="h-full w-full"
    >
      <div className="flex h-full flex-col justify-center px-7 py-6 sm:px-9">
        <span
          className="mb-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px] backdrop-blur-[8px]"
          style={{ color: LAB.muted, border: `1px solid ${LAB.line}`, background: "rgba(10,11,16,.55)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: LAB.amber }} /> Ambient background
        </span>
        <h2
          className="max-w-[15ch] text-[clamp(1.5rem,3.2vw,2.25rem)] font-extrabold leading-[1.08] tracking-tight"
          style={{ color: LAB.ink, textShadow: "0 2px 26px rgba(10,11,16,.95), 0 0 3px rgba(10,11,16,.7)" }}
        >
          Depth that scrolls like a core sample, not decoration.
        </h2>
        <p
          className="mt-2.5 max-w-[38ch] text-[13.5px] leading-relaxed"
          style={{ color: LAB.body, textShadow: "0 1px 18px rgba(10,11,16,.95)" }}
        >
          Sediment bands drift past a fixed reading line and fault breaks step cleanly around your content.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span
            className="rounded-[10px] px-3.5 py-2 text-[13px] font-bold"
            style={{ background: LAB.amber, color: LAB.ground }}
          >
            Get started
          </span>
          <span
            className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold backdrop-blur-[8px]"
            style={{ border: `1px solid ${LAB.line}`, color: LAB.ink, background: "rgba(10,11,16,.5)" }}
          >
            View docs
          </span>
        </div>
      </div>
    </CoreStrata>
  );
}

export default CoreStrataCatalogPreview;
