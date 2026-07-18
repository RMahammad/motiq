"use client";

import * as React from "react";

import {
  SourceCitationRail,
  CitationMarker,
  type CitationSource,
  type CitationLayout,
} from "@/registry/ai/source-citation-rail";
import {
  ControlBar,
  ControlButton,
  ControlToggle,
  ControlSegmented,
  ControlDivider,
} from "../_components/preview-controls";

/* -------------------------------------------------------------------------
 * DEMO ONLY. Every source below is clearly fictional and lives in local state.
 * There is no retrieval, no model, and no verification happening here — the
 * component only renders the sources this preview hands it, and the "verified"
 * flags are values this demo set by hand. The controls mutate that local array
 * so you can see selection, excerpts, layout modes, and insertion.
 * ---------------------------------------------------------------------- */

const INITIAL_SOURCES: CitationSource[] = [
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
      "Servers should flush tokens as they are produced and apply backpressure when the client's read buffer fills, rather than materialising the whole response first.",
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
      "Participants reported markedly higher trust when inline markers were visibly linked to a browsable source list they could inspect and open.",
  },
  {
    id: "s3",
    index: 3,
    title: "Answer latency benchmarks across streaming strategies",
    domain: "data.northwind-ai.dev",
    url: "https://example.com/data/latency",
    type: "dataset",
    author: "Benchmarks Team",
    publishedAt: "2026-05-20",
    retrievedAt: "2026-07-14",
    relevance: 0.63,
    verified: false,
    excerpt:
      "Median time-to-first-token dropped from 840ms to 210ms after switching to token-level flushing on the reference workload.",
  },
];

const EXTRA_SOURCES: CitationSource[] = [
  {
    id: "s4",
    index: 4,
    title: "Designing accessible reference rails",
    domain: "handbook.interface-lab.org",
    url: "https://example.com/guides/accessible-rails",
    type: "article",
    author: "Accessibility Guild",
    publishedAt: "2026-03-30",
    retrievedAt: "2026-07-14",
    relevance: 0.77,
    verified: false,
    excerpt:
      "Never convey the active citation with colour alone: pair it with a marker, a weight change, and an explicit label for assistive technology.",
  },
  {
    id: "s5",
    index: 5,
    title: "Chunked transfer encoding - living standard",
    domain: "spec.web-fabric.org",
    url: "https://example.com/spec/chunked",
    type: "web",
    author: "Web Fabric WG",
    publishedAt: "2026-01-08",
    retrievedAt: "2026-07-14",
    relevance: 0.58,
    verified: true,
    excerpt:
      "Each chunk is prefixed by its size in hexadecimal; a zero-length chunk signals the end of the message body.",
  },
];

export function SourceCitationRailPreview() {
  const [sources, setSources] = React.useState<CitationSource[]>(INITIAL_SOURCES);
  const [activeId, setActiveId] = React.useState<string | null>("s1");
  const [layout, setLayout] = React.useState<CitationLayout>("rail");
  const [showExcerpts, setShowExcerpts] = React.useState(true);
  const [opened, setOpened] = React.useState<string | null>(null);
  const openedTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(openedTimer.current), []);

  const selectNext = () => {
    const ids = sources.map((s) => s.id);
    if (ids.length === 0) return;
    const cur = activeId && ids.includes(activeId) ? ids.indexOf(activeId) : -1;
    setActiveId(ids[(cur + 1) % ids.length]);
  };

  const addSource = () => {
    setSources((prev) => {
      const next = EXTRA_SOURCES.find((s) => !prev.some((p) => p.id === s.id));
      if (!next) return prev;
      setActiveId(next.id);
      return [...prev, next];
    });
  };

  const reset = () => {
    clearTimeout(openedTimer.current);
    setOpened(null);
    setSources(INITIAL_SOURCES);
    setActiveId("s1");
    setLayout("rail");
    setShowExcerpts(true);
  };

  const canAdd = EXTRA_SOURCES.some((s) => !sources.some((p) => p.id === s.id));

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4">
      {/* Controls -------------------------------------------------------- */}
      <ControlBar label="Citation rail controls">
        <ControlButton
          onClick={selectNext}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M13 5l7 7-7 7M4 12h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          Select next source
        </ControlButton>
        <ControlButton
          onClick={addSource}
          disabled={!canAdd}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        >
          Add source
        </ControlButton>
        <ControlToggle pressed={showExcerpts} onPressedChange={setShowExcerpts}>
          {showExcerpts ? "Hide excerpts" : "Show excerpts"}
        </ControlToggle>
        <ControlDivider />
        <ControlSegmented
          label="Layout"
          value={layout}
          onChange={setLayout}
          options={[
            { value: "rail", label: "Rail" },
            { value: "list", label: "List" },
            { value: "cards", label: "Cards" },
          ]}
        />
        <ControlDivider />
        <ControlButton
          onClick={reset}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 11a8 8 0 1 1 .7 4.2M4 17v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          Reset
        </ControlButton>
      </ControlBar>

      {/* Component ------------------------------------------------------- */}
      <SourceCitationRail
        sources={sources}
        activeSourceId={activeId}
        onActiveSourceChange={setActiveId}
        layout={layout}
        showExcerpts={showExcerpts}
        mobileBehavior="bottom"
        onOpenSource={(s) => {
          setOpened(s.title);
          clearTimeout(openedTimer.current);
          openedTimer.current = setTimeout(() => setOpened(null), 2600);
        }}
      >
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_55%,#000))] text-[var(--color-accent-fg)]" aria-hidden>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </span>
            <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">AI answer workspace</p>
          </div>

          <h2 className="text-[19px] font-semibold leading-snug tracking-tight text-[var(--color-fg)]">
            How should a product stream AI answers with low latency?
          </h2>

          <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-[var(--color-fg)]">
            <p>
              Flush tokens to the client as soon as they are produced instead of buffering the whole
              response, and apply backpressure when the read buffer fills
              <CitationMarker source="s1" />. In a field study, readers trusted answers more when inline
              markers were clearly tied to a source list they could open and inspect
              <CitationMarker source="s2" />.
            </p>
            <p>
              On the reference workload, switching to token-level flushing cut median time-to-first-token
              from 840ms to 210ms <CitationMarker source="s3" />. Keep the citation rail accessible -
              selection should never rely on colour alone
              {sources.some((s) => s.id === "s4") ? <CitationMarker source="s4" /> : null} - and match the
              chunked-transfer contract your transport already speaks
              {sources.some((s) => s.id === "s5") ? <CitationMarker source="s5" /> : null}.
            </p>
          </div>

          <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-[11.5px] text-[var(--color-muted)]">
            Demo content and sources are fictional. This component only displays the citations the app passes
            it - it does not retrieve, verify, or score anything. “Verified” reflects a flag set by this demo.
          </p>
        </article>
      </SourceCitationRail>

      <p className="min-h-[1rem] text-center text-[11.5px] text-[var(--color-muted)]" aria-live="polite">
        {opened ? `onOpenSource fired for “${opened}” (link opens in a new tab).` : "Select a marker or a source to sync the rail."}
      </p>
    </div>
  );
}

export default SourceCitationRailPreview;
