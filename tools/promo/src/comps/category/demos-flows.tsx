import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, monoFamily } from "../../theme";
import { Bar, CheckDot, Chip, clamp01, Panel, Skel, spinnerGlyph } from "./ui";

// File workflows + Commerce + Security & accounts + Communication micro-demos.

const FileRow: React.FC<{ name: string; size: string; progress: number; frame: number }> = ({
  name,
  size,
  progress,
  frame,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        background: colors.surfaceStrong,
        border: `1px solid ${colors.borderStrong}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        color: colors.accentText,
        flexShrink: 0,
      }}
    >
      {name.split(".").pop()?.toUpperCase()}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: colors.fgSecondary }}>{name}</span>
        <span style={{ fontSize: 12.5, color: colors.muted }}>
          {progress >= 1 ? size : `${Math.round(clamp01(progress) * 100)}%`}
        </span>
      </div>
      <Bar value={progress} width={190} color={progress >= 1 ? colors.success : colors.accent} />
    </div>
    <CheckDot p={progress >= 1 ? clamp01((progress - 1) * 10 + 1) : 0} size={22} />
    {progress > 0 && progress < 1 && (
      <span style={{ color: colors.accentText, fontSize: 14, width: 0, marginLeft: -10 }}>
        {spinnerGlyph(frame)}
      </span>
    )}
  </div>
);

export const MultiFileQueueDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 210;
  const local = frame % period;
  const files = [
    { name: "brand-video.mp4", size: "48 MB", at: 0, dur: 90 },
    { name: "hero-shot.png", size: "2.1 MB", at: 24, dur: 50 },
    { name: "report-q3.pdf", size: "830 KB", at: 48, dur: 40 },
  ];
  return (
    <Panel width={306}>
      <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
        {files.map((f) => (
          <FileRow
            key={f.name}
            name={f.name}
            size={f.size}
            progress={clamp01((local - f.at) / f.dur)}
            frame={frame}
          />
        ))}
      </div>
    </Panel>
  );
};

export const ProcessingTimelineDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 200;
  const local = frame % period;
  const steps = [
    { label: "Upload", at: 0 },
    { label: "Virus scan", at: 44 },
    { label: "Transcode", at: 88 },
    { label: "Publish", at: 140 },
  ];
  return (
    <Panel width={290}>
      {steps.map((s, i) => {
        const p = clamp01((local - s.at) / 26);
        const running = local >= s.at && p < 1;
        return (
          <div key={s.label} style={{ display: "flex", gap: 13 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CheckDot p={p} size={24} />
              {i < steps.length - 1 && (
                <div style={{ width: 3, height: 26, background: colors.surfaceStrong, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: "100%", height: `${clamp01((local - s.at - 20) / 24) * 100}%`, background: colors.accent }} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, height: 24, opacity: 0.35 + clamp01((local - s.at + 10) / 12) * 0.65 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: p >= 1 ? colors.muted : colors.fg }}>{s.label}</span>
              {running && <span style={{ color: colors.accentText, fontSize: 14 }}>{spinnerGlyph(frame)}</span>}
            </div>
          </div>
        );
      })}
    </Panel>
  );
};

export const VariantSelectorDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const swatches = ["#4f7cff", "#34d399", "#fbbf24", "#f472b6"];
  const period = 62;
  const active = Math.floor(frame / period) % swatches.length;
  const local = frame % period;
  const settle = spring({ frame: local, fps, config: { damping: 16, stiffness: 260 }, durationInFrames: 24 });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: 22,
          background: `linear-gradient(145deg, ${swatches[active]}, ${colors.surfaceStrong})`,
          border: `1px solid ${colors.borderStrong}`,
          boxShadow: `0 16px 44px ${swatches[active]}44`,
          transform: `scale(${0.94 + clamp01(settle) * 0.06})`,
          display: "flex",
          alignItems: "flex-end",
          padding: 14,
        }}
      >
        <Skel w={54} h={9} tone="bright" />
      </div>
      <div style={{ display: "flex", gap: 13 }}>
        {swatches.map((c, i) => (
          <div
            key={c}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: c,
              border: `3px solid ${i === active ? colors.fg : "transparent"}`,
              transform: `scale(${i === active ? 0.95 + clamp01(settle) * 0.15 : 1})`,
              boxShadow: i === active ? `0 0 18px ${c}88` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const CheckoutProgressDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 210;
  const local = frame % period;
  const steps = ["Cart", "Shipping", "Payment"];
  const per = 58;
  return (
    <Panel width={296}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        {steps.map((s, i) => {
          const p = clamp01((local - i * per) / 20);
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <div style={{ flex: 1, height: 3, margin: "0 8px", borderRadius: 2, background: colors.surfaceStrong, overflow: "hidden" }}>
                  <div style={{ width: `${clamp01((local - (i - 1) * per - 20) / 34) * 100}%`, height: "100%", background: colors.accent }} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <CheckDot p={p} size={26} color={colors.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: p > 0 ? colors.fg : colors.muted }}>{s}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.fg, fontVariantNumeric: "tabular-nums" }}>
            $149.00
          </div>
        </div>
        <div
          style={{
            padding: "11px 22px",
            borderRadius: 11,
            background: local > 3 * per ? colors.success : colors.accent,
            color: local > 3 * per ? "#0b1020" : "#fff",
            fontSize: 15.5,
            fontWeight: 700,
          }}
        >
          {local > 3 * per ? "✓ Order placed" : "Continue"}
        </div>
      </div>
    </Panel>
  );
};

export const TwoFactorDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 190;
  const local = frame % period;
  const code = [7, 3, 9, 1, 4, 2];
  const startAt = 18;
  const per = 13;
  const filled = Math.floor(clamp01((local - startAt) / (per * 6)) * 6);
  const verified = local > startAt + per * 6 + 22;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: colors.fgSecondary }}>
        Enter the 6-digit code
      </div>
      <div style={{ display: "flex", gap: 9 }}>
        {code.map((d, i) => {
          const has = i < filled;
          const activeBox = i === filled && !verified;
          return (
            <div
              key={i}
              style={{
                width: 40,
                height: 50,
                borderRadius: 10,
                border: `2px solid ${verified ? colors.success : activeBox ? colors.accent : colors.borderStrong}`,
                background: colors.bgElevated,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: monoFamily,
                fontSize: 23,
                fontWeight: 700,
                color: verified ? colors.success : colors.fg,
                boxShadow: activeBox ? `0 0 16px ${colors.accent}66` : "none",
              }}
            >
              {has ? d : ""}
            </div>
          );
        })}
      </div>
      <div style={{ height: 36 }}>
        {verified && (
          <Chip color={colors.success} style={{ fontSize: 15 }}>
            ✓ Identity verified
          </Chip>
        )}
      </div>
    </div>
  );
};

export const PasskeyDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const period = 160;
  const local = frame % period;
  const scanning = local < 80;
  const ringP = clamp01((local - 80) / 24);
  const sweep = (local % 40) / 40;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div
        style={{
          position: "relative",
          width: 120,
          height: 120,
          borderRadius: 999,
          border: `3px solid ${scanning ? colors.accent : colors.success}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 34px ${scanning ? colors.accent : colors.success}55`,
          overflow: "hidden",
        }}
      >
        {scanning && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${sweep * 100}%`,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${colors.accentText}, transparent)`,
            }}
          />
        )}
        {scanning ? (
          <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke={colors.accentText} strokeWidth={1.6} strokeLinecap="round">
            <path d="M12 11a4 4 0 014 4v2M12 11a4 4 0 00-4 4v1M12 7.5A7.5 7.5 0 0119.5 15v1.5M12 7.5A7.5 7.5 0 004.5 15M12 14.5V19" />
          </svg>
        ) : (
          <svg width={54} height={54} viewBox="0 0 24 24" fill="none">
            <path
              d="M4.5 12.5l5 5L19.5 7"
              stroke={colors.success}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={26}
              strokeDashoffset={26 * (1 - ringP)}
            />
          </svg>
        )}
      </div>
      <Chip color={scanning ? colors.accentText : colors.success} style={{ fontSize: 15 }}>
        {scanning ? "Touch sensor to continue" : "✓ Passkey created"}
      </Chip>
    </div>
  );
};

export const DeliveryStatesDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 210;
  const local = frame % period;
  const sendAt = 14;
  const p = spring({ frame: local - sendAt, fps, config: { damping: 19, stiffness: 210 } });
  const stage = local < sendAt + 24 ? 0 : local < sendAt + 60 ? 1 : local < sendAt + 100 ? 2 : 3;
  const ticks = ["🕐", "✓", "✓✓", "✓✓"];
  const replyP = spring({ frame: local - 150, fps, config: { damping: 18, stiffness: 220 } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 280 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "16px 16px 4px 16px",
            background: colors.accent,
            opacity: p,
            transform: `translateY(${(1 - p) * 18}px) scale(${0.92 + p * 0.08})`,
          }}
        >
          <Skel w={140} h={8} tone="bright" />
          <Skel w={90} h={8} tone="bright" style={{ marginTop: 7, opacity: 0.75 }} />
          <div style={{ marginTop: 9, textAlign: "right", fontSize: 12.5, color: stage === 3 ? "#9fdcff" : "rgba(255,255,255,0.75)", fontWeight: 700 }}>
            {ticks[stage]} {stage === 0 ? "sending" : stage === 1 ? "sent" : stage === 2 ? "delivered" : "read"}
          </div>
        </div>
      </div>
      {local >= 150 && (
        <div style={{ display: "flex" }}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "16px 16px 16px 4px",
              background: colors.surfaceRaised,
              border: `1px solid ${colors.borderStrong}`,
              opacity: replyP,
              transform: `translateY(${(1 - replyP) * 16}px)`,
            }}
          >
            <Skel w={110} h={8} />
          </div>
        </div>
      )}
    </div>
  );
};

export const TypingPresenceDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const users = [
    { name: "Alex", tint: "#7f9fff", typingAt: [0, 90] as [number, number] },
    { name: "Sam", tint: "#34d399", typingAt: [110, 200] as [number, number] },
  ];
  const period = 220;
  const local = frame % period;
  return (
    <Panel width={286}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {users.map((u) => {
          const typing = local >= u.typingAt[0] && local < u.typingAt[1];
          const pulse = 0.6 + 0.4 * Math.sin(frame / 9);
          return (
            <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 40, height: 40, borderRadius: 999, background: `linear-gradient(135deg, ${u.tint}, ${colors.surfaceStrong})` }} />
                <div
                  style={{
                    position: "absolute",
                    right: -1,
                    bottom: -1,
                    width: 13,
                    height: 13,
                    borderRadius: 999,
                    background: colors.success,
                    border: `2.5px solid ${colors.bgElevated}`,
                    transform: `scale(${typing ? pulse * 0.4 + 0.8 : 1})`,
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.fg }}>{u.name}</div>
                <div style={{ fontSize: 13.5, color: typing ? colors.accentText : colors.muted, height: 18 }}>
                  {typing ? (
                    <span>
                      typing
                      {".".repeat((Math.floor(frame / 12) % 3) + 1)}
                    </span>
                  ) : (
                    "online"
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export const ThreadExpansionDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 200;
  const local = frame % period;
  const expandAt = 40;
  const collapseAt = 150;
  const raw = spring({ frame: local - expandAt, fps, config: { damping: 21, stiffness: 180 } });
  const back = spring({ frame: local - collapseAt, fps, config: { damping: 21, stiffness: 180 } });
  const open = clamp01(raw - back);
  const replies = [0, 1, 2];
  return (
    <div style={{ width: 286 }}>
      <Panel width={286} style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "linear-gradient(135deg, #7f9fff, #243249)", flexShrink: 0 }} />
          <div>
            <Skel w={150} h={8} tone="bright" />
            <Skel w={100} h={7} style={{ marginTop: 6 }} />
          </div>
        </div>
        <div style={{ marginTop: 11, fontSize: 13.5, fontWeight: 700, color: colors.accentText }}>
          {open > 0.5 ? "▾" : "▸"} 3 replies
        </div>
      </Panel>
      <div style={{ overflow: "hidden", height: open * 150, marginLeft: 22 }}>
        {replies.map((r) => (
          <div
            key={r}
            style={{
              marginTop: 9,
              padding: "10px 13px",
              borderRadius: 11,
              border: `1px solid ${colors.border}`,
              background: colors.bgElevated,
              borderLeft: `3px solid ${colors.accent}`,
              opacity: clamp01(open * 3 - r * 0.7),
              transform: `translateY(${(1 - open) * 10}px)`,
            }}
          >
            <Skel w={140 - r * 20} h={7} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const FileUploadPipelineDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 190;
  const local = frame % period;
  const drop = spring({ frame: local - 6, fps, config: { damping: 15, stiffness: 210 } });
  const progress = clamp01((local - 34) / 70);
  const done = local > 120;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 290 }}>
      <div
        style={{
          width: 290,
          height: 110,
          borderRadius: 16,
          border: `2px dashed ${done ? colors.success : colors.accent}`,
          background: colors.bgElevated,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - drop) * -26}px) scale(${0.6 + drop * 0.4})`,
            opacity: drop,
          }}
        >
          {done ? (
            <CheckDot p={1} size={34} />
          ) : (
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={colors.accentText} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 007 21h10a1.5 1.5 0 001.5-1.5V7.5L14 3z" />
              <path d="M14 3v4.5h4.5M9 13h6M9 16.5h4" />
            </svg>
          )}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.muted }}>
          {done ? "Upload complete" : local < 34 ? "Drop file to upload" : "Uploading…"}
        </span>
      </div>
      <div style={{ width: 250 }}>
        <Bar value={done ? 1 : progress} width={250} color={done ? colors.success : colors.accent} />
      </div>
    </div>
  );
};

export const CartTransitionDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 200;
  const local = frame % period;
  const addAt = 30;
  const p = spring({ frame: local - addAt, fps, config: { damping: 17, stiffness: 210 } });
  const items = [
    { tint: "#7f9fff", price: 59, base: true },
    { tint: "#34d399", price: 90, base: false },
  ];
  const total = 59 + Math.round(clamp01(p) * 90);
  return (
    <Panel width={292}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, i) => {
          const vis = item.base ? 1 : clamp01(p);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 52 * (item.base ? 1 : vis),
                opacity: vis,
                transform: `translateX(${(1 - vis) * 60}px)`,
                overflow: "hidden",
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${item.tint}, ${colors.surfaceStrong})`, flexShrink: 0 }} />
              <div>
                <Skel w={110} h={8} tone="bright" />
                <Skel w={64} h={7} style={{ marginTop: 6 }} />
              </div>
              <div style={{ marginLeft: "auto", fontSize: 16, fontWeight: 700, color: colors.fg, fontVariantNumeric: "tabular-nums" }}>
                ${item.price}
              </div>
            </div>
          );
        })}
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: colors.muted }}>Total</span>
          <span style={{ fontSize: 21, fontWeight: 800, color: colors.accentText, fontVariantNumeric: "tabular-nums" }}>
            ${total}.00
          </span>
        </div>
      </div>
    </Panel>
  );
};

export const SessionSecurityDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 210;
  const local = frame % period;
  const revokeAt = 90;
  const gone = spring({ frame: local - revokeAt, fps, config: { damping: 20, stiffness: 190 } });
  const sessions = [
    { device: "MacBook Pro", meta: "This device", safe: true },
    { device: "iPhone 16", meta: "Berlin · now", safe: true },
    { device: "Unknown device", meta: "Riga · 2m ago", safe: false },
  ];
  return (
    <Panel width={296}>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {sessions.map((s) => {
          const removing = !s.safe;
          const vis = removing ? 1 - clamp01(gone) : 1;
          return (
            <div
              key={s.device}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 11,
                border: `1px solid ${removing ? "#f87171" : colors.border}`,
                background: removing ? "rgba(248,113,113,0.08)" : colors.surface,
                height: 56 * vis,
                opacity: vis,
                transform: `translateX(${(1 - vis) * 80}px)`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: removing ? "rgba(248,113,113,0.14)" : colors.accentSoft,
                  border: `1px solid ${removing ? "#f87171" : colors.borderStrong}`,
                }}
              >
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={removing ? "#f87171" : colors.accentText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {removing ? (
                    <path d="M12 4v9M12 17.5v.5" />
                  ) : (
                    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                  )}
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.fg }}>{s.device}</div>
                <div style={{ fontSize: 12.5, color: colors.muted }}>{s.meta}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: removing ? "#f87171" : colors.success }}>
                {removing ? "revoke" : "active"}
              </div>
            </div>
          );
        })}
        <div style={{ height: 26, display: "flex", alignItems: "center" }}>
          {local > revokeAt + 24 && (
            <Chip color={colors.success} style={{ fontSize: 13 }}>
              ✓ Suspicious session revoked
            </Chip>
          )}
        </div>
      </div>
    </Panel>
  );
};
