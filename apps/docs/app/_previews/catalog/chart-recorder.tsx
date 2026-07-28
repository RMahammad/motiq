"use client";

import * as React from "react";

import { ChartRecorderBackground } from "@/registry/backgrounds/chart-recorder";

/**
 * The component now commits to a fixed dark Motion Lab palette (see
 * chart-recorder.tsx) — the hero copy must match the lab's `.hero` styling
 * exactly (fixed light ink + text-shadow), NOT theme tokens.
 */
const LAB_ACCENT = "#7c6cff"; // Live Signal stage accent (root --violet)

const heroPillStyle: React.CSSProperties = {
  color: "#8f95ab",
  border: "1px solid #232636",
  background: "rgba(10,11,16,.55)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: 999,
};

const heroTitleStyle: React.CSSProperties = {
  color: "#eceef8",
  fontWeight: 800,
  textShadow: "0 2px 26px rgba(10,11,16,.95), 0 0 3px rgba(10,11,16,.7)",
};

const heroBodyStyle: React.CSSProperties = {
  color: "#b7bccf",
  textShadow: "0 1px 18px rgba(10,11,16,.95)",
};

const heroCtaStyle: React.CSSProperties = {
  background: LAB_ACCENT,
  color: "#0a0b10",
  fontWeight: 700,
  borderRadius: 10,
};

const heroGhostStyle: React.CSSProperties = {
  border: "1px solid #232636",
  color: "#eceef8",
  background: "rgba(10,11,16,.5)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: 10,
};

/**
 * Compact catalog adapter. Renders the REAL ChartRecorderBackground FULL-BLEED
 * with a concise hero overlaid on its readable safe area. No demo controls or
 * inner frame (the detail page owns the interactive playground). Deterministic;
 * sized to the ambient stage.
 */
export function ChartRecorderCatalogPreview() {
  return (
    <ChartRecorderBackground
      lanes={3}
      density={1}
      safeArea={{ x: 0.03, y: 0.08, w: 0.52, h: 0.84 }}
      className="h-full w-full"
    >
      <div className="flex h-full flex-col justify-center px-7 py-6 sm:px-9">
        <span
          className="mb-3 inline-flex w-fit items-center gap-2 px-3 py-1 text-[12px] font-mono tracking-wide"
          style={heroPillStyle}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: LAB_ACCENT }} /> Ambient background
        </span>
        <h2
          className="max-w-[15ch] text-[clamp(1.5rem,3.2vw,2.25rem)] leading-[1.08] tracking-tight"
          style={heroTitleStyle}
        >
          Signal that reads calm, not chaotic.
        </h2>
        <p className="mt-2.5 max-w-[38ch] text-[13.5px] leading-relaxed" style={heroBodyStyle}>
          A slow recency sweep writes each lane, fading into a settled trace behind it - so headline, copy, and CTA stay crisp on top.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="px-3.5 py-2 text-[13px]" style={heroCtaStyle}>
            Get started
          </span>
          <span className="px-3.5 py-2 text-[13px] font-semibold" style={heroGhostStyle}>
            View docs
          </span>
        </div>
      </div>
    </ChartRecorderBackground>
  );
}

export default ChartRecorderCatalogPreview;
