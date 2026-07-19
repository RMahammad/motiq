import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter, fade, pop } from "../helpers";
import { colors, monoFamily } from "../theme";
import { Stage, Window } from "../shared";

export const installSchema = z.object({
  command: z.string(),
  componentName: z.string(),
});

export const installDefaults: z.infer<typeof installSchema> = {
  command: "npx shadcn add https://motiq.dev/r/spotlight-card",
  componentName: "spotlight-card",
};

const TYPE_START = 14;
const CHARS_PER_FRAME = 0.62;
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"];

export const Install: React.FC<z.infer<typeof installSchema>> = ({ command, componentName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typedCount = Math.min(
    command.length,
    Math.max(0, Math.floor((frame - TYPE_START) * CHARS_PER_FRAME)),
  );
  const typeEnd = TYPE_START + command.length / CHARS_PER_FRAME;
  const enterPressed = frame > typeEnd + 8;
  const cursorOn = Math.floor(frame / 16) % 2 === 0;

  const steps = [
    { at: typeEnd + 14, text: "Checking registry." },
    { at: typeEnd + 30, text: "Installing dependencies." },
    { at: typeEnd + 46, text: `Created components/ui/${componentName}.tsx` },
  ];
  const doneAt = steps[2].at + 6;
  const cardIn = pop({ frame, fps, delay: doneAt });

  // Spotlight orbit inside the preview card once it lands.
  const t = Math.max(0, frame - doneAt) / fps;
  const spotX = 50 + Math.cos(t * 1.4) * 32;
  const spotY = 45 + Math.sin(t * 1.4) * 26;

  const windowIn = enter({ frame, fps, delay: 0 });

  return (
    <Stage glowX="28%" glowY="24%">
      <AbsoluteFill
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40 }}
      >
        <div
          style={{
            opacity: windowIn,
            transform: `translateY(${interpolate(windowIn, [0, 1], [30, 0])}px)`,
          }}
        >
          <Window title="motiq — zsh" width={694}>
            <div
              style={{
                padding: "26px 28px",
                fontFamily: monoFamily,
                fontSize: 19,
                lineHeight: 1.9,
                minHeight: 300,
                color: colors.fgSecondary,
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <span style={{ color: colors.success, marginRight: 12 }}>❯</span>
                <span style={{ color: colors.fg, wordBreak: "break-all", flex: 1 }}>
                  {command.slice(0, typedCount)}
                  {!enterPressed && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 11,
                        height: 22,
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                        background: cursorOn ? colors.accentText : "transparent",
                      }}
                    />
                  )}
                </span>
              </div>
              {enterPressed && frame < steps[0].at && (
                <div style={{ color: colors.accentText }}>
                  {SPINNER[Math.floor(frame / 4) % SPINNER.length]} Resolving {componentName}…
                </div>
              )}
              {steps.map((step) => {
                const o = fade(frame, step.at, step.at + 6);
                return (
                  <div key={step.text} style={{ opacity: o }}>
                    <span style={{ color: colors.success, marginRight: 10 }}>✔</span>
                    {step.text}
                  </div>
                );
              })}
              <div style={{ opacity: fade(frame, doneAt + 4, doneAt + 10), color: colors.muted }}>
                <span style={{ color: colors.success, marginRight: 10 }}>❯</span>
                Done. Editable source — it&apos;s yours now.
              </div>
            </div>
          </Window>
        </div>

        <div
          style={{
            width: 360,
            opacity: cardIn,
            transform: `scale(${interpolate(cardIn, [0, 1], [0.8, 1])}) translateY(${interpolate(cardIn, [0, 1], [24, 0])}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              border: `1px solid ${colors.borderStrong}`,
              background: colors.surface,
              padding: 30,
              overflow: "hidden",
              boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(79,124,255,0.18)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle 220px at ${spotX}% ${spotY}%, rgba(79,124,255,0.28), transparent 70%)`,
              }}
            />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: colors.accentSoft,
                  border: `1px solid ${colors.borderStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
                    stroke={colors.accentText}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: colors.fg, marginBottom: 10 }}>
                Spotlight Card
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.6, color: colors.muted }}>
                A pointer-tracking glow that lifts your content off the page.
              </div>
              <div
                style={{
                  marginTop: 22,
                  display: "inline-flex",
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: colors.accent,
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(79,124,255,0.4)",
                }}
              >
                Ship it
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
