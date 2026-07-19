import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../../theme";
import { CheckDot, Chip, clamp01, Panel, Skel } from "./ui";

// Collaboration + Data motion + Productivity micro-demos.

export const CommentThreadDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 220;
  const local = frame % period;
  const bubbles = [
    { tint: "#7f9fff", w: 200, at: 0, mine: false },
    { tint: "#34d399", w: 160, at: 55, mine: true },
    { tint: "#7f9fff", w: 180, at: 130, mine: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, width: 290 }}>
      {bubbles.map((b, i) => {
        const p = spring({ frame: local - b.at, fps, config: { damping: 18, stiffness: 220 } });
        const typing = local >= b.at - 28 && local < b.at;
        return (
          <div key={i} style={{ display: "flex", justifyContent: b.mine ? "flex-end" : "flex-start" }}>
            {typing ? (
              <div style={{ display: "flex", gap: 5, padding: "12px 16px", borderRadius: 14, background: colors.surfaceStrong }}>
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: colors.muted,
                      transform: `translateY(${Math.sin((local + d * 6) / 5) * -3}px)`,
                    }}
                  />
                ))}
              </div>
            ) : local >= b.at ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 14}px) scale(${0.9 + p * 0.1})`,
                  flexDirection: b.mine ? "row-reverse" : "row",
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 999, background: `linear-gradient(135deg, ${b.tint}, ${colors.surfaceStrong})`, flexShrink: 0 }} />
                <div
                  style={{
                    padding: "11px 14px",
                    borderRadius: 14,
                    background: b.mine ? colors.accent : colors.surfaceRaised,
                    border: `1px solid ${b.mine ? colors.accentHover : colors.borderStrong}`,
                  }}
                >
                  <Skel w={b.w * 0.8} h={7} tone={b.mine ? "bright" : "muted"} />
                  <Skel w={b.w * 0.55} h={7} tone={b.mine ? "bright" : "muted"} style={{ marginTop: 6, opacity: 0.7 }} />
                </div>
              </div>
            ) : (
              <div style={{ height: 30 }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const ApprovalDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 200;
  const local = frame % period;
  const steps = [
    { label: "Requested", by: "M", at: 0 },
    { label: "Reviewed", by: "A", at: 60 },
    { label: "Approved", by: "S", at: 120 },
  ];
  return (
    <Panel width={296}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((s, i) => {
          const p = clamp01((local - s.at) / 20);
          return (
            <div key={s.label} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <CheckDot p={p} size={26} color={i === 2 ? colors.accent : colors.success} />
                {i < 2 && (
                  <div style={{ width: 3, height: 34, background: colors.surfaceStrong, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: "100%", height: `${clamp01((local - s.at - 16) / 40) * 100}%`, background: colors.accent }} />
                  </div>
                )}
              </div>
              <div style={{ paddingTop: 2, opacity: 0.35 + p * 0.65 }}>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: p > 0 ? colors.fg : colors.muted }}>{s.label}</div>
                <div style={{ fontSize: 13.5, color: colors.muted, marginTop: 2 }}>by teammate {s.by} · just now</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export const KpiMorphDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 90;
  const step = Math.floor(frame / period) % 3;
  const local = frame % period;
  const targets = [12480, 15920, 14210];
  const prev = targets[(step + 2) % 3];
  const cur = targets[step];
  const t = clamp01(local / 34);
  const eased = 1 - (1 - t) * (1 - t) * (1 - t);
  const value = Math.round(prev + (cur - prev) * eased);
  const up = cur > prev;
  const pop = spring({ frame: local - 4, fps, config: { damping: 15, stiffness: 240 }, durationInFrames: 26 });
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1.5, color: colors.muted, marginBottom: 10 }}>
        MONTHLY REVENUE
      </div>
      <div style={{ fontSize: 58, fontWeight: 800, color: colors.fg, fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>
        ${value.toLocaleString("en-US")}
      </div>
      <div style={{ marginTop: 12, display: "inline-block", transform: `scale(${0.8 + clamp01(pop) * 0.2})` }}>
        <Chip color={up ? colors.success : "#f87171"}>
          {up ? "▲" : "▼"} {Math.abs(Math.round(((cur - prev) / prev) * 100))}% vs last month
        </Chip>
      </div>
    </div>
  );
};

export const StreamingRowsDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rowH = 46;
  const every = 34;
  const shown = Math.floor(frame / every);
  const tints = ["#7f9fff", "#34d399", "#fbbf24", "#f472b6", "#22d3ee", "#a78bfa"];
  return (
    <div style={{ width: 300, height: 250, overflow: "hidden", display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: 6 }, (_, i) => {
        const idx = shown - i;
        if (idx < 0) return <div key={i} style={{ height: rowH }} />;
        const isNew = i === 0;
        const p = isNew
          ? spring({ frame: frame - shown * every, fps, config: { damping: 20, stiffness: 240 } })
          : 1;
        const tint = tints[((idx % tints.length) + tints.length) % tints.length];
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: rowH,
              padding: "0 14px",
              borderRadius: 11,
              border: `1px solid ${isNew ? colors.accent : colors.border}`,
              background: isNew ? colors.surfaceRaised : colors.bgElevated,
              opacity: Math.max(0.25, 1 - i * 0.14) * p,
              transform: `translateY(${(1 - p) * -rowH}px)`,
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 999, background: tint }} />
            <Skel w={90 + ((idx * 37) % 60)} h={8} tone={isNew ? "bright" : "muted"} />
            <div style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 700, color: isNew ? colors.accentText : colors.muted, fontVariantNumeric: "tabular-nums" }}>
              +{(idx % 9) + 1}.{(idx * 7) % 10}k
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const FilterTransitionDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 110;
  const filtered = Math.floor(frame / period) % 2 === 1;
  const local = frame % period;
  const t = spring({ frame: local - 10, fps, config: { damping: 20, stiffness: 190 } });
  const m = filtered ? t : 1 - t;
  const cells = Array.from({ length: 9 }, (_, i) => i);
  const keep = [0, 2, 4, 7];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["All", "Active"].map((f, i) => (
          <div
            key={f}
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              border: `1px solid ${colors.borderStrong}`,
              background: (i === 1) === filtered ? colors.accent : colors.bgElevated,
              color: (i === 1) === filtered ? "#fff" : colors.muted,
            }}
          >
            {f}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 84px)", gap: 10 }}>
        {cells.map((i) => {
          const kept = keep.includes(i);
          const gone = kept ? 0 : m;
          return (
            <div
              key={i}
              style={{
                height: 54,
                borderRadius: 10,
                border: `1px solid ${kept && m > 0.5 ? colors.accent : colors.border}`,
                background: colors.bgElevated,
                opacity: 1 - gone * 0.92,
                transform: `scale(${1 - gone * 0.35})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Skel w={44} h={7} tone={kept && m > 0.5 ? "accent" : "muted"} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DependencyMapDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 180;
  const local = frame % period;
  const nodes = [
    { x: 50, y: 60, at: 0 },
    { x: 50, y: 180, at: 20 },
    { x: 150, y: 120, at: 55 },
    { x: 250, y: 60, at: 95 },
    { x: 250, y: 180, at: 95 },
  ];
  const edges: Array<[number, number]> = [[0, 2], [1, 2], [2, 3], [2, 4]];
  return (
    <svg width={300} height={240} viewBox="0 0 300 240">
      {edges.map(([a, b], i) => {
        const from = nodes[a];
        const to = nodes[b];
        const p = clamp01((local - to.at + 30) / 30);
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={from.x + (to.x - from.x) * p}
            y2={from.y + (to.y - from.y) * p}
            stroke={p >= 1 ? colors.accent : colors.borderStrong}
            strokeWidth={2.5}
          />
        );
      })}
      {nodes.map((n, i) => {
        const done = clamp01((local - n.at) / 16);
        return (
          <g key={i}>
            <rect
              x={n.x - 34}
              y={n.y - 20}
              width={68}
              height={40}
              rx={10}
              fill={done > 0 ? colors.surfaceRaised : colors.bgElevated}
              stroke={done > 0.5 ? colors.accent : colors.borderStrong}
              strokeWidth={1.6}
              opacity={0.4 + done * 0.6}
            />
            <rect x={n.x - 20} y={n.y - 4} width={40} height={8} rx={4} fill={done > 0.5 ? colors.accentText : colors.surfaceStrong} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
};

export const ProjectTimelineDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 190;
  const local = frame % period;
  const playhead = interpolate(local, [0, period], [0, 280]);
  const rows = [
    { start: 0, len: 120, tint: colors.accent, at: 0 },
    { start: 60, len: 140, tint: "#34d399", at: 22 },
    { start: 130, len: 110, tint: "#fbbf24", at: 44 },
    { start: 200, len: 80, tint: "#f472b6", at: 66 },
  ];
  return (
    <div style={{ position: "relative", width: 292, padding: "10px 0" }}>
      {rows.map((r, i) => {
        const grow = clamp01((local - r.at) / 34);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Skel w={34} h={7} />
            <div style={{ position: "relative", flex: 1, height: 22 }}>
              <div
                style={{
                  position: "absolute",
                  left: r.start * 0.82,
                  width: r.len * 0.82 * grow,
                  height: 22,
                  borderRadius: 7,
                  background: `linear-gradient(90deg, ${r.tint}, ${r.tint}cc)`,
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 44 + playhead * 0.82,
          width: 2,
          background: colors.fgSecondary,
          opacity: 0.65,
        }}
      />
    </div>
  );
};
