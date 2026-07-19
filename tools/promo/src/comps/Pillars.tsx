import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter, pop } from "../helpers";
import { colors } from "../theme";
import { Badge, Stage } from "../shared";

export const pillarsSchema = z.object({
  heading: z.string(),
  kicker: z.string(),
  items: z.array(z.object({ title: z.string(), sub: z.string() })).length(4),
});

export const pillarsDefaults: z.infer<typeof pillarsSchema> = {
  heading: "Production-ready by default",
  kicker: "No cleanup required",
  items: [
    { title: "Accessible", sub: "WCAG 2.2 AA — keyboard, focus & screen readers covered." },
    { title: "Reduced-motion safe", sub: "Every animation respects prefers-reduced-motion." },
    { title: "SSR & RSC safe", sub: "No hydration surprises in Next.js App Router." },
    { title: "Editable source", sub: "Installed into your repo. No lock-in, no black box." },
  ],
};

const Check: React.FC<{ progress: number }> = ({ progress }) => {
  const length = 26;
  return (
    <div
      style={{
        width: 54,
        height: 54,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${colors.accent}, #315fea)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 ${24 * progress}px rgba(79,124,255,0.55)`,
        flexShrink: 0,
      }}
    >
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <path
          d="M4.5 12.5l5 5L19.5 7"
          stroke="#fff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - progress)}
        />
      </svg>
    </div>
  );
};

export const Pillars: React.FC<z.infer<typeof pillarsSchema>> = ({ heading, kicker, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = enter({ frame, fps, delay: 4 });
  return (
    <Stage glowY="16%">
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 62 }}>
        <Badge delay={0}>{kicker}</Badge>
        <div
          style={{
            marginTop: 20,
            marginBottom: 40,
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -1.5,
            color: colors.fg,
            opacity: headIn,
            transform: `translateY(${interpolate(headIn, [0, 1], [22, 0])}px)`,
          }}
        >
          {heading}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 500px)", gap: 22 }}>
          {items.map((item, i) => {
            const delay = 22 + i * 14;
            const p = enter({ frame, fps, delay });
            const check = pop({ frame, fps, delay: delay + 8 });
            return (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "26px 28px",
                  borderRadius: 18,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  boxShadow: "0 16px 44px rgba(0,0,0,0.35)",
                  opacity: p,
                  transform: `translateX(${interpolate(p, [0, 1], [i % 2 === 0 ? -36 : 36, 0])}px)`,
                }}
              >
                <div style={{ transform: `scale(${0.5 + Math.min(1, check) * 0.5})` }}>
                  <Check progress={Math.min(1, Math.max(0, check))} />
                </div>
                <div>
                  <div style={{ fontSize: 27, fontWeight: 700, color: colors.fg, marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 18.5, lineHeight: 1.5, color: colors.muted }}>{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
