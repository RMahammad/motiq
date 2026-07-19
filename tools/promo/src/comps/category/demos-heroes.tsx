import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../../theme";
import { Bar, CheckDot, Chip, clamp01, Panel, Skel, spinnerGlyph } from "./ui";

// Workflow Heroes — miniature stacked product-hero blocks (copy band + surface).

const HeroShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 312, display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <Skel w={190} h={13} tone="bright" />
      <Skel w={132} h={9} />
    </div>
    {children}
  </div>
);

export const AgentOpsHeroDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const agents = [
    { name: "researcher", period: 120, off: 0 },
    { name: "planner", period: 120, off: 40 },
    { name: "executor", period: 120, off: 80 },
  ];
  return (
    <HeroShell>
      <Panel width={312} glow={0.4}>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {agents.map((a) => {
            const local = (frame + a.off) % a.period;
            const running = local < 70;
            return (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckDot p={running ? 0 : 1} size={22} />
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.fgSecondary, width: 92 }}>
                  {a.name}
                </div>
                {running ? (
                  <Bar value={local / 70} width={120} />
                ) : (
                  <Chip color={colors.success} style={{ padding: "2px 10px", fontSize: 12 }}>
                    done
                  </Chip>
                )}
                {running && (
                  <span style={{ color: colors.accentText, fontSize: 14 }}>{spinnerGlyph(frame)}</span>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </HeroShell>
  );
};

export const DeployHeroDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const stages = ["build", "test", "canary", "prod"];
  const period = 170;
  const local = frame % period;
  const per = 36;
  return (
    <HeroShell>
      <Panel width={312}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {stages.map((s, i) => {
            const p = clamp01((local - i * per) / 18);
            const active = local >= i * per && local < (i + 1) * per;
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div style={{ flex: 1, height: 3, margin: "0 6px", borderRadius: 2, background: colors.surfaceStrong, overflow: "hidden" }}>
                    <div style={{ width: `${clamp01((local - (i - 1) * per - 18) / 18) * 100}%`, height: "100%", background: colors.accent }} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <CheckDot p={p} size={24} color={i === 3 ? colors.accent : colors.success} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? colors.fg : colors.muted }}>{s}</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <Chip color={colors.success} style={{ fontSize: 12 }}>● healthy</Chip>
          <Chip style={{ fontSize: 12 }}>v2.4.{Math.floor(frame / period) % 3}</Chip>
        </div>
      </Panel>
    </HeroShell>
  );
};

export const LiveDataHeroDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const points = Array.from({ length: 40 }, (_, i) => {
    const x = i * 7;
    const y = 40 - (Math.sin(i * 0.45 + frame / 22) * 12 + Math.sin(i * 0.9 - frame / 30) * 7);
    return `${x},${y}`;
  }).join(" ");
  const kpi = 4200 + Math.floor(820 * (0.5 + 0.5 * Math.sin(frame / 45)));
  const pop = spring({ frame: frame % 45, fps, config: { damping: 20, stiffness: 200 }, durationInFrames: 20 });
  return (
    <HeroShell>
      <Panel width={312} glow={0.3}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: colors.fg, fontVariantNumeric: "tabular-nums" }}>
            {kpi.toLocaleString("en-US")}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.success, transform: `scale(${0.9 + pop * 0.1})` }}>
            ▲ live
          </div>
        </div>
        <svg width={280} height={54} viewBox="0 0 280 54" style={{ marginTop: 8 }}>
          <polyline points={points} fill="none" stroke={colors.accent} strokeWidth={2.4} strokeLinejoin="round" />
        </svg>
      </Panel>
    </HeroShell>
  );
};
