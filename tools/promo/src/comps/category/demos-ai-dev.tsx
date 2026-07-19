import React from "react";
import { useCurrentFrame } from "remotion";
import { monoFamily, colors } from "../../theme";
import { Bar, CheckDot, Chip, clamp01, Panel, Skel, spinnerGlyph } from "./ui";

// AI interfaces + Developer tools micro-demos.

export const ResponseStreamDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = [220, 260, 180, 240, 130];
  const period = 210;
  const local = frame % period;
  const chars = local * 3.2;
  let used = 0;
  return (
    <Panel width={300} glow={0.35}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent}, #315fea)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          ✦
        </div>
        <Skel w={90} h={9} tone="bright" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lines.map((w, i) => {
          const grown = clamp01((chars - used) / w) * w;
          used += w;
          return <Skel key={i} w={Math.max(2, grown)} h={9} tone={i === 0 ? "accent" : "muted"} />;
        })}
      </div>
      <div
        style={{
          marginTop: 12,
          width: 9,
          height: 16,
          background: Math.floor(frame / 14) % 2 === 0 ? colors.accentText : "transparent",
        }}
      />
    </Panel>
  );
};

export const ToolCallDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const calls = [
    { fn: "search_docs()", at: 0 },
    { fn: "read_file()", at: 55 },
    { fn: "run_tests()", at: 110 },
  ];
  const period = 200;
  const local = frame % period;
  return (
    <Panel width={300}>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {calls.map((c) => {
          const started = local >= c.at;
          const done = local >= c.at + 42;
          return (
            <div
              key={c.fn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                opacity: started ? 1 : 0.25,
                transform: `translateX(${started ? 0 : 8}px)`,
              }}
            >
              <CheckDot p={done ? 1 : 0} size={22} />
              <span style={{ fontFamily: monoFamily, fontSize: 15.5, color: done ? colors.fgSecondary : colors.fg }}>
                {c.fn}
              </span>
              {started && !done && (
                <span style={{ color: colors.accentText, fontSize: 15 }}>{spinnerGlyph(frame)}</span>
              )}
              {done && (
                <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: colors.muted }}>
                  {(0.3 + (c.at % 3) * 0.4).toFixed(1)}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export const PipelineDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const stages = ["lint", "build", "e2e", "deploy"];
  const period = 190;
  const local = frame % period;
  const per = 40;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15, width: 290 }}>
      {stages.map((s, i) => {
        const p = clamp01((local - i * per) / 26);
        const running = local >= i * per && p < 1;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckDot p={p} size={24} />
            <span
              style={{
                fontFamily: monoFamily,
                fontSize: 15.5,
                width: 70,
                color: p >= 1 ? colors.muted : colors.fg,
              }}
            >
              {s}
            </span>
            <Bar value={p} width={130} color={p >= 1 ? colors.success : colors.accent} />
            {running && <span style={{ color: colors.accentText }}>{spinnerGlyph(frame)}</span>}
          </div>
        );
      })}
    </div>
  );
};

const LOG_LINES: Array<{ level: string; text: string }> = [
  { level: "INFO", text: "server listening :3000" },
  { level: "INFO", text: "GET /api/health 200" },
  { level: "WARN", text: "cache miss user:42" },
  { level: "INFO", text: "POST /api/orders 201" },
  { level: "INFO", text: "job queue drained" },
  { level: "ERR ", text: "retrying webhook (1/3)" },
  { level: "INFO", text: "webhook delivered" },
  { level: "INFO", text: "GET /api/feed 200" },
];

export const LogStreamDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = Math.floor(frame / 16);
  const levelColor = (l: string) =>
    l === "WARN" ? colors.amber : l.trim() === "ERR" ? "#f87171" : colors.success;
  return (
    <Panel width={306} style={{ height: 240, overflow: "hidden", padding: "14px 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, justifyContent: "flex-end", height: "100%" }}>
        {Array.from({ length: 8 }, (_, i) => {
          const idx = shown - 7 + i;
          if (idx < 0) return <div key={i} style={{ height: 15 }} />;
          const line = LOG_LINES[idx % LOG_LINES.length];
          const fresh = i === 7;
          return (
            <div
              key={i}
              style={{
                fontFamily: monoFamily,
                fontSize: 13.5,
                display: "flex",
                gap: 9,
                opacity: fresh ? clamp01((frame % 16) / 6) : 0.45 + i * 0.07,
              }}
            >
              <span style={{ color: levelColor(line.level), fontWeight: 700 }}>{line.level}</span>
              <span style={{ color: colors.fgSecondary }}>{line.text}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export const EnvSwitcherDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const envs = ["dev", "staging", "prod"];
  const period = 80;
  const active = Math.floor(frame / period) % 3;
  const local = frame % period;
  const slide = clamp01(local / 14);
  const prev = (active + 2) % 3;
  const thumbX = (prev + (active - prev) * slide) * 92;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          borderRadius: 12,
          border: `1px solid ${colors.borderStrong}`,
          background: colors.bgElevated,
          padding: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4 + thumbX,
            width: 88,
            height: 40,
            borderRadius: 9,
            background: colors.accent,
            opacity: 0.9,
          }}
        />
        {envs.map((e, i) => (
          <div
            key={e}
            style={{
              position: "relative",
              width: 92,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15.5,
              fontWeight: 700,
              color: i === active ? "#fff" : colors.muted,
            }}
          >
            {e}
          </div>
        ))}
      </div>
      <Chip color={active === 2 ? colors.amber : colors.success}>
        ● {active === 2 ? "production — guarded" : "connected"}
      </Chip>
    </div>
  );
};
