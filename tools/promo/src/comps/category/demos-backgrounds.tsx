import React from "react";
import { useCurrentFrame } from "remotion";
import { seededRandom } from "../../helpers";
import { colors } from "../../theme";

// Product Backgrounds — miniature versions of the animated background components.

export const TopologyFieldDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const rand = seededRandom(11);
  const nodes = Array.from({ length: 9 }, () => ({
    x: 30 + rand() * 260,
    y: 30 + rand() * 220,
  }));
  const edges: Array<[number, number]> = [
    [0, 2], [1, 2], [2, 4], [3, 4], [4, 6], [5, 6], [6, 8], [4, 7], [1, 5],
  ];
  return (
    <svg width={320} height={280} viewBox="0 0 320 280">
      {edges.map(([a, b], i) => {
        const pulse = ((frame * 1.6 + i * 37) % 130) / 130;
        const na = nodes[a];
        const nb = nodes[b];
        const px = na.x + (nb.x - na.x) * pulse;
        const py = na.y + (nb.y - na.y) * pulse;
        return (
          <g key={i}>
            <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={colors.border} strokeWidth={1.5} />
            <circle cx={px} cy={py} r={3} fill={colors.accentText} opacity={0.9} />
          </g>
        );
      })}
      {nodes.map((n, i) => {
        const glow = 0.5 + 0.5 * Math.sin(frame / 18 + i * 1.7);
        return (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={10 + glow * 4} fill={colors.accent} opacity={0.12 * glow} />
            <circle cx={n.x} cy={n.y} r={5} fill={colors.surfaceStrong} stroke={colors.accent} strokeWidth={1.5} />
          </g>
        );
      })}
    </svg>
  );
};

export const QueueLanesDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const lanes = [
    { label: "ingest", speed: 2.4, count: 3, offset: 0 },
    { label: "transform", speed: 1.7, count: 2, offset: 60 },
    { label: "index", speed: 3.0, count: 3, offset: 130 },
    { label: "deliver", speed: 2.0, count: 2, offset: 30 },
  ];
  const laneWidth = 300;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: laneWidth }}>
      {lanes.map((lane, li) => (
        <div key={lane.label}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 8, letterSpacing: 1 }}>
            {lane.label.toUpperCase()}
          </div>
          <div
            style={{
              position: "relative",
              height: 14,
              borderRadius: 7,
              background: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              overflow: "hidden",
            }}
          >
            {Array.from({ length: lane.count }, (_, i) => {
              const span = laneWidth + 70;
              const x = ((frame * lane.speed + lane.offset + (i * span) / lane.count) % span) - 60;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: x,
                    top: 2,
                    width: 54,
                    height: 8,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, transparent, ${li % 2 === 0 ? colors.accent : colors.accentText})`,
                    opacity: 0.9,
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ContourSurfaceDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const rings = 7;
  return (
    <svg width={320} height={280} viewBox="0 0 320 280">
      {Array.from({ length: rings }, (_, i) => {
        const t = frame / 40;
        const base = 26 + i * 20;
        const points = Array.from({ length: 48 }, (_, k) => {
          const a = (k / 48) * Math.PI * 2;
          const wobble =
            Math.sin(a * 3 + t + i * 0.8) * 7 + Math.sin(a * 5 - t * 1.3 + i) * 4;
          const r = base + wobble;
          return `${160 + Math.cos(a) * r * 1.15},${140 + Math.sin(a) * r * 0.82}`;
        }).join(" ");
        const bright = i === Math.floor((frame / 26) % rings);
        return (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke={bright ? colors.accentText : colors.borderStrong}
            strokeWidth={bright ? 2.2 : 1.4}
            opacity={bright ? 0.95 : 0.85}
          />
        );
      })}
    </svg>
  );
};
