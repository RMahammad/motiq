"use client";
import * as React from "react";

export interface ProdFacts {
  package: string;
  importPath: string;
  boundary: string;
  bundle: string;
  deps: string;
  ssr: string;
  a11y: string;
  reducedMotion: string;
  intents?: string;
  install: string;
  tests: string;
  browser: string;
  limitations: string;
}

const VIEWPORTS = { mobile: 390, tablet: 768, desktop: 9999 } as const;
type Viewport = keyof typeof VIEWPORTS;

/**
 * ComponentStage — the live component-page stage. Renders the REAL component under real controls
 * (viewport, theme, reduced-motion, replay) plus a verifiable production-readiness panel. Reduced
 * motion is demonstrated live by neutralizing animation/transition inside the preview. Client
 * island; the page around it stays server-rendered (ADR-0016, interactive-demo-authoring skill).
 */
export function ComponentStage({
  code,
  facts,
  children,
}: {
  code: string;
  facts: ProdFacts;
  children: React.ReactNode;
}) {
  const [dark, setDark] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [vw, setVw] = React.useState<Viewport>("desktop");
  const [replay, setReplay] = React.useState(0);

  const rows: Array<[string, string]> = [
    ["package", facts.package],
    ["import", facts.importPath],
    ["boundary", facts.boundary],
    ["bundle", facts.bundle],
    ["dependencies", facts.deps],
    ["ssr", facts.ssr],
    ["accessibility", facts.a11y],
    ["reduced motion", facts.reducedMotion],
    ...(facts.intents ? ([["motion intents", facts.intents]] as Array<[string, string]>) : []),
    ["install", facts.install],
    ["tests", facts.tests],
    ["browser", facts.browser],
    ["limitations", facts.limitations],
  ];

  return (
    <div className="lab">
      <div className="lab__bar">
        <span className="lab__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mono">live preview</span>
        <button type="button" className="btn btn--sm" onClick={() => setReplay((r) => r + 1)}>
          ▷ Replay
        </button>
      </div>

      <div className="cstage" data-theme={dark ? "dark" : undefined}>
        <div
          className="cstage__inner"
          data-reduced={reduced || undefined}
          style={{ maxWidth: VIEWPORTS[vw] }}
          key={replay}
        >
          {children}
        </div>
      </div>

      <div className="cstage__controls">
        <div className="seg" role="group" aria-label="Preview viewport">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => (
            <button key={v} type="button" aria-pressed={vw === v} onClick={() => setVw(v)}>
              {v}
            </button>
          ))}
        </div>
        <label className="switch">
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
          dark theme
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={reduced}
            onChange={(e) => {
              setReduced(e.target.checked);
              setReplay((r) => r + 1);
            }}
          />
          reduced-motion
        </label>
      </div>

      <div className="code">
        <pre>
          <code>{code}</code>
        </pre>
      </div>

      <dl className="panel" aria-label="Production readiness">
        {rows.map(([k, v]) => (
          <div className="panel__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
