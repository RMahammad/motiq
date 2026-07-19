"use client";

import * as React from "react";

import {
  SourceCitationRail,
  CitationMarker,
  type CitationSource,
} from "@/registry/ai/source-citation-rail";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL SourceCitationRail in
 * one representative state — a short answer with two inline markers, the first
 * source active — trimmed to 2 sources, with no layout/excerpt/add controls.
 * The detail page keeps the full interactive rig.
 */

const SOURCES: CitationSource[] = [
  {
    id: "s1",
    index: 1,
    title: "Streaming responses: backpressure and chunked transfer",
    domain: "docs.northwind-ai.dev",
    url: "https://example.com/docs/streaming",
    type: "docs",
    author: "Platform Docs",
    publishedAt: "2026-02-11",
    retrievedAt: "2026-07-14",
    relevance: 0.94,
    location: "§2.3",
    verified: true,
    excerpt:
      "Servers should flush tokens as they are produced and apply backpressure when the client's read buffer fills.",
  },
  {
    id: "s2",
    index: 2,
    title: "A field study of citation trust in AI answer interfaces",
    domain: "review.interface-lab.org",
    url: "https://example.com/papers/citation-trust",
    type: "paper",
    author: "Okafor & Lindqvist",
    publishedAt: "2025-11-03",
    retrievedAt: "2026-07-14",
    relevance: 0.81,
    location: "p. 7",
    verified: true,
    excerpt:
      "Participants reported markedly higher trust when inline markers were visibly linked to a browsable source list.",
  },
];

export function SourceCitationRailCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <SourceCitationRail sources={SOURCES} defaultActiveSourceId="s1" layout="rail">
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            AI answer workspace
          </p>
          <h2 className="text-[18px] font-semibold leading-snug tracking-tight text-[var(--color-fg)]">
            How should a product stream AI answers with low latency?
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--color-fg)]">
            Flush tokens to the client as soon as they are produced instead of buffering the whole
            response, and apply backpressure when the read buffer fills
            <CitationMarker source="s1" />. In a field study, readers trusted answers more when inline
            markers were clearly tied to a source list they could open and inspect
            <CitationMarker source="s2" />.
          </p>
        </article>
      </SourceCitationRail>
    </div>
  );
}

export default SourceCitationRailCatalogPreview;
