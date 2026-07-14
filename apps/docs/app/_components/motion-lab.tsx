"use client";
import * as React from "react";
import { MotionScene, MotionStep, type MotionIntent } from "@scope/motion";
import { PricingCard } from "@scope/react";

const INTENSITIES = ["reduced", "standard", "expressive"] as const;
type Intensity = (typeof INTENSITIES)[number];
const INTENTS: MotionIntent[] = ["introduce", "emphasize", "confirm", "notify"];
const DURATION: Record<Intensity, number> = { reduced: 220, standard: 320, expressive: 440 };

/**
 * Motion Laboratory — the signature live stage. Real MotionScene + real PricingCard under real
 * controls (semantic intent, intensity, reduced-motion, theme, replay). The code readout is
 * derived from the same state that drives the demo. Understandable with animation disabled.
 * Client island; the rest of the page stays server-rendered (ADR-0016).
 */
export function MotionLab() {
  const [intensity, setIntensity] = React.useState<Intensity>("standard");
  const [intent, setIntent] = React.useState<MotionIntent>("introduce");
  const [reduced, setReduced] = React.useState(false);
  const [dark, setDark] = React.useState(false);
  const [replay, setReplay] = React.useState(0);
  const bump = () => setReplay((r) => r + 1);

  const rm = reduced ? "force-reduce" : "respect";
  const code = `<MotionScene preset="product-introduction" intensity="${intensity}"${
    reduced ? ' reducedMotion="force-reduce"' : ""
  }>
  <MotionStep role="heading">…</MotionStep>
  <MotionStep role="supporting-content" intent="deemphasize">…</MotionStep>
  <MotionStep role="product-preview" intent="${intent}">
    <PricingCard planName="Pro" price="$29" … />
  </MotionStep>
  <MotionStep role="primary-action" intent="emphasize">…</MotionStep>
</MotionScene>`;

  return (
    <div className="lab">
      <div className="lab__bar">
        <span className="lab__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mono">motion-scene · product-introduction</span>
        <button type="button" className="btn btn--sm" onClick={bump}>
          ▷ Replay
        </button>
      </div>

      <div className="lab__grid">
        <div className="stage" data-theme={dark ? "dark" : undefined}>
          <MotionScene
            key={replay}
            trigger="mount"
            intensity={intensity}
            reducedMotion={rm}
            gap="md"
            className="demo-col"
          >
            <MotionStep role="heading">
              <h3 className="demo-h">Ship Pro</h3>
            </MotionStep>
            <MotionStep role="supporting-content" intent="deemphasize">
              <p className="demo-p">Coordinated, accessible motion — from one scene.</p>
            </MotionStep>
            <MotionStep role="product-preview" intent={intent}>
              <PricingCard
                planName="Pro"
                price="$29"
                period="/mo"
                features={["Choreographed entrance", "Reduced-motion built in"]}
                cta={{ label: "Choose Pro" }}
                featured
                badge="Live demo"
              />
            </MotionStep>
          </MotionScene>
        </div>

        <div className="rail">
          <div className="control">
            <span className="control__label">Intent · preview</span>
            <div className="seg" role="group" aria-label="Semantic motion intent">
              {INTENTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={intent === v}
                  onClick={() => {
                    setIntent(v);
                    bump();
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="control">
            <span className="control__label">Intensity</span>
            <div className="seg" role="group" aria-label="Motion intensity">
              {INTENSITIES.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={intensity === v}
                  onClick={() => {
                    setIntensity(v);
                    bump();
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => {
                setReduced(e.target.checked);
                bump();
              }}
            />
            prefers-reduced-motion
          </label>
          <label className="switch">
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
            dark theme
          </label>

          <div className="readout" aria-live="polite">
            <div>
              duration · <b>{reduced ? 0 : DURATION[intensity]}ms</b>
            </div>
            <div>
              stagger · <b>90ms</b> × step
            </div>
            <div>
              reduced · <b>{reduced ? "final state, no transform" : "respects OS"}</b>
            </div>
            <div>
              ssr · <b>renders final markup</b>
            </div>
          </div>
        </div>
      </div>

      <div className="code">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
