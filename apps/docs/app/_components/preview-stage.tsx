"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";

import { ControlButton, ControlSegmented, ControlToggle } from "./preview-controls";

export type StageType = "text" | "canvas" | "icon" | "interactive" | "card";

// Category-specific backdrops so components don't all look identical.
const VARIANT: Record<StageType, { min: string; cls: string; style?: React.CSSProperties }> = {
  text: {
    min: "min-h-[280px] sm:min-h-[340px]",
    cls: "px-2 sm:px-6",
    style: {
      background:
        "radial-gradient(120% 120% at 50% 0%, color-mix(in oklab, var(--color-accent) 12%, var(--color-surface)) 0%, var(--color-surface) 55%)",
    },
  },
  interactive: {
    min: "min-h-[300px] sm:min-h-[360px]",
    cls: "px-2 sm:px-6",
    style: {
      background:
        "linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 6%, var(--color-surface)), var(--color-surface))",
    },
  },
  card: {
    min: "min-h-[300px] sm:min-h-[340px]",
    cls: "px-2 sm:px-6",
    style: { background: "var(--color-bg-secondary)" },
  },
  canvas: {
    min: "min-h-[320px] sm:min-h-[400px]",
    cls: "p-0",
    style: { background: "var(--color-surface)" },
  },
  icon: {
    min: "min-h-[200px] sm:min-h-[240px]",
    cls: "px-2 sm:px-6",
    style: {
      background:
        "radial-gradient(90% 120% at 50% 10%, color-mix(in oklab, var(--color-accent) 10%, var(--color-surface)), var(--color-surface))",
    },
  },
};

export function PreviewStage({
  children,
  stage = "interactive",
  showControls = true,
}: {
  children: React.ReactNode;
  stage?: StageType;
  showControls?: boolean;
}) {
  const [nonce, setNonce] = React.useState(0);
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");
  const [reduced, setReduced] = React.useState(false);
  const v = VARIANT[stage];

  // Default the stage theme to the PAGE theme at mount (a light page must show a
  // light stage). Deferred to an effect to avoid a hydration mismatch; the stage
  // still has its own Light/Dark toggle afterward.
  React.useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "light" || t === "dark") setTheme(t);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div
        data-stage="main"
        data-theme={theme}
        data-reduced={reduced || undefined}
        style={v.style}
        className={`relative isolate flex items-center justify-center ${v.min} ${v.cls} ${
          reduced ? "[&_*]:!animate-none [&_*]:!transition-none" : ""
        }`}
      >
        {/* soft top light + fine vignette, not a hard dotted grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(140% 90% at 50% -10%, transparent 60%, color-mix(in oklab, var(--color-fg) 5%, transparent) 100%)",
          }}
        />
        <MotionConfig reducedMotion={reduced ? "always" : "user"}>
          <div key={nonce} className="relative flex w-full items-center justify-center py-5 py-10">
            {children}
          </div>
        </MotionConfig>
      </div>

      {showControls ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
          <ControlButton
            onClick={() => setNonce((n) => n + 1)}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Replay
          </ControlButton>
          <div className="ml-auto flex items-center gap-2">
            <ControlSegmented
              label="Preview theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <ControlToggle pressed={reduced} onPressedChange={setReduced}>
              Reduce motion
            </ControlToggle>
          </div>
        </div>
      ) : null}
    </div>
  );
}
