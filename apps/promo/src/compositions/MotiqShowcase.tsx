import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { AgentRunTimeline } from "@/registry/ai/agent-run-timeline";
import { AiResponseStream } from "@/registry/ai/ai-response-stream";
import { ToolCallActivity } from "@/registry/ai/tool-call-activity";
import { ApprovalWorkflow } from "@/registry/collaboration/approval-workflow";
import { LivePresenceStack } from "@/registry/collaboration/live-presence-stack";
import { DataRefreshState } from "@/registry/data/data-refresh-state";
import { KpiNumberMorph } from "@/registry/data/kpi-number-morph";
import { StreamingDataRows, type Column } from "@/registry/data/streaming-data-rows";

import { agentAt } from "../adapters/agent";
import { collabAt } from "../adapters/collab";
import { dashboardAt } from "../adapters/dashboard";
import { STREAM_SOURCES } from "../data/agent";
import { COLLAB_NOW } from "../data/collab";
import { DASH_LAST_UPDATED, DASH_NOW, KPIS, type RegionRow } from "../data/dashboard";
import { ComposerShot } from "../scenes/AgentScene";
import { CollabPanels } from "../scenes/CollabScene";
import { DataDashboard } from "../scenes/DataScene";
import { PipelinePanel } from "../scenes/PipelineScene";
import { TopologyBackdrop } from "../scenes/TopologyBackdrop";
import { cardDuration, cardInner, showcaseCopy } from "../showcase";
import { enter, rampE } from "../theme/anim";
import { monoFamily } from "../theme/fonts";
import { Atmosphere, PromoRoot, Wordmark, Zoom } from "../theme/stage";

/* ------------------------------------------------------------------ chrome */

const CARD_RADIUS = 26;

/** Translucent navy card with a soft border and faint top highlight. */
const cardShell: React.CSSProperties = {
  position: "relative",
  borderRadius: CARD_RADIUS,
  border: "1px solid rgba(122,156,255,0.17)",
  background: "linear-gradient(180deg, rgba(18,27,46,0.93) 0%, rgba(10,16,29,0.97) 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.055), inset 0 0 0 1px rgba(9,14,26,0.4), 0 22px 54px rgba(0,4,14,0.42)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

/** Category label row: accent-dot kicker + tiny mono workflow synopsis. */
const CardHead: React.FC<{ label: string; sub?: string; size?: number }> = ({
  label,
  sub,
  size = 15,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 16,
      padding: "20px 24px 0",
      flexShrink: 0,
    }}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: 1.9,
        textTransform: "uppercase",
        color: "var(--color-accent-text)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "var(--color-accent)",
          boxShadow: "0 0 10px 1px rgba(79,124,255,0.75)",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
    {sub ? (
      <span
        style={{
          fontFamily: monoFamily,
          fontSize: size * 0.84,
          color: "var(--color-subtle)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {sub}
      </span>
    ) : null}
  </div>
);

/** Deep-navy field behind the grid: brand glow + a very faint topology. */
const ShowcaseField: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <Atmosphere glow={0.4} />
    <TopologyBackdrop
      frame={frame}
      period={cardDuration}
      opacity={0.1}
      showLabels={false}
    />
  </>
);

/* ------------------------------------------------------------- card scenes */

/**
 * Stats card — typography-led. The count settles with a short count-up, then
 * everything is static; frozen mid-hold it reads as pure set type.
 */
const StatsCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { stats } = showcaseCopy;
  const countP = rampE(frame, 6, 34);
  const count = Math.round(stats.count * countP);

  const row = (delay: number): React.CSSProperties => {
    const p = enter({ frame, fps, delay });
    return { opacity: p, transform: `translateY(${(1 - p) * 10}px)` };
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "26px 32px 26px",
        minHeight: 0,
      }}
    >
      <div style={row(0)}>
        <Wordmark size={38} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            ...row(4),
            fontSize: 128,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: -4,
            background:
              "linear-gradient(115deg, #e8efff 4%, var(--color-accent) 52%, var(--color-gradient-end) 98%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            paddingBottom: 6,
          }}
        >
          {count}
          {stats.countSuffix}
        </div>
        <div
          style={{
            ...row(10),
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: -0.7,
            color: "var(--color-fg)",
            marginTop: 2,
          }}
        >
          {stats.title}
        </div>
        <div
          style={{
            ...row(14),
            fontSize: 21,
            color: "var(--color-fg-secondary)",
            marginTop: 8,
          }}
        >
          {stats.subtitle}
        </div>
      </div>
      <div style={{ ...row(18), display: "flex", flexDirection: "column", gap: 7 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-muted)" }}>
          {stats.line}
        </span>
        <span style={{ fontSize: 13.5, color: "var(--color-subtle)" }}>{stats.meta}</span>
      </div>
    </div>
  );
};

const panelShell: React.CSSProperties = {
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-md)",
  overflow: "hidden",
};

/**
 * AI Interface scene, phase-swapped like the hero: composer → run timeline +
 * tool activity → run timeline + streamed answer with citations. The final
 * phase doubles as the composite's frozen state.
 */
const AiCardScene: React.FC<{ width?: number; panelHeight?: number; scale?: number }> = ({
  width = 872,
  panelHeight = 296,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const { workspaceAt, streamAt, beats } = cardInner.agent;
  const s = agentAt(frame, beats);

  const swapA = rampE(frame, workspaceAt - 3, workspaceAt + 9);
  const swapB = rampE(frame, streamAt - 3, streamAt + 9);
  const activityIn = rampE(frame, workspaceAt + 8, workspaceAt + 20);

  const row = (extra: React.CSSProperties): React.CSSProperties => ({
    display: "flex",
    gap: 16,
    width,
    maxWidth: "100%",
    alignItems: "flex-start",
    ...extra,
  });

  /** Each phase is its own centered layer so crossfades stay aligned. */
  const layer = (opacity: number): React.CSSProperties => ({
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: 16,
    opacity,
  });

  return (
    <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
      {/* Phase A — Prompt Composer */}
      {swapA < 1 ? (
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", opacity: 1 - swapA }}
        >
          <Zoom factor={1.04 * scale}>
            <ComposerShot beats={beats} width={640} />
          </Zoom>
        </AbsoluteFill>
      ) : null}

      {/* Phase B — run timeline + tool activity (approval included) */}
      {swapA > 0 && swapB < 1 ? (
        <AbsoluteFill style={layer(Math.min(swapA, 1 - swapB))}>
          <div style={row({ transform: `scale(${scale})`, transformOrigin: "top center" })}>
            <div style={{ flex: "0 0 48%", minWidth: 0, ...panelShell, maxHeight: panelHeight }}>
              <AgentRunTimeline
                run={s.run}
                followActive={false}
                compactCompleted
                defaultExpanded={false}
              />
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                ...panelShell,
                maxHeight: panelHeight,
                opacity: activityIn,
                transform: `translateX(${(1 - activityIn) * 22}px)`,
              }}
            >
              <ToolCallActivity
                calls={s.calls}
                compactCompleted
                defaultExpanded={["tc-deploys"]}
              />
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Phase C — run timeline + streamed answer with source citations */}
      {swapB > 0 ? (
        <AbsoluteFill style={layer(swapB)}>
          <div
            style={row({
              transform: `scale(${scale}) translateY(${(1 - swapB) * 12}px)`,
              transformOrigin: "top center",
            })}
          >
            <div style={{ flex: "0 0 42%", minWidth: 0, ...panelShell, maxHeight: panelHeight }}>
              <AgentRunTimeline
                run={s.run}
                followActive={false}
                compactCompleted
                defaultExpanded={false}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0, ...panelShell, maxHeight: panelHeight }}>
              <AiResponseStream
                segments={s.segments}
                state={s.streamState}
                sources={STREAM_SOURCES}
                assistantName="Assistant"
                caret={false}
              />
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </div>
  );
};

/** Developer Tools scene — the deployment pipeline story in a console window. */
const PipelineCardScene: React.FC<{ width?: number; zoom?: number }> = ({
  width = 560,
  zoom = 1.06,
}) => (
  <div
    style={{
      flex: 1,
      minHeight: 0,
      padding: "8px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    <Zoom factor={zoom}>
      {/* Cap the stage list so the open-logs state can't push the console's
          title bar off the card — the crop lands at the bottom instead. */}
      <PipelinePanel beats={cardInner.pipeline} width={width} maxHeight={356} />
    </Zoom>
  </div>
);

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");

const NARROW_COLUMNS: Column<RegionRow>[] = [
  { key: "region", header: "Region", value: (r) => r.region },
  {
    key: "orders",
    header: "Orders / hr",
    align: "end",
    numeric: true,
    value: (r) => r.orders,
    format: fmtInt,
  },
  {
    key: "health",
    header: "Health",
    align: "end",
    value: (r) => r.health,
    render: (r) => (
      <span
        aria-hidden
        style={{
          fontSize: 12,
          color: r.health === "healthy" ? "var(--color-success)" : "var(--color-warning)",
        }}
      >
        {r.health === "healthy" ? "●" : "▲"}
      </span>
    ),
  },
];

/**
 * Data Motion scene, narrow cut: two KPI morphs, the refresh lifecycle, and a
 * compact region table — refresh begins, values morph, rows settle.
 */
const DataCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const s = dashboardAt(frame, cardInner.data);
  const kpis = [KPIS[0], KPIS[1]];

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: "16px 24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        {kpis.map((k) => (
          <KpiNumberMorph
            key={k.id}
            label={k.label}
            value={s.kpiValues[k.id]}
            suffix={k.suffix}
            decimals={k.decimals}
            change={s.settled ? k.change : undefined}
            changeLabel={s.settled ? k.changeLabel : undefined}
            state="idle"
            style={{ flex: 1, minWidth: 0 }}
          />
        ))}
      </div>
      <DataRefreshState
        mode="inline"
        state={s.refreshState}
        progress={s.progress}
        updatedCount={s.settled ? s.updatedCount : undefined}
        totalCount={4}
        label="Regional orders"
        lastUpdated={DASH_LAST_UPDATED}
        now={DASH_NOW}
        onRefresh={() => undefined}
        reducedMotion
      />
      <StreamingDataRows<RegionRow>
        rows={s.rows}
        columns={NARROW_COLUMNS}
        getRowId={(r) => r.id}
        sort={{ key: "orders", dir: "desc" }}
        onSortChange={() => undefined}
        announceUpdates={false}
        caption="Orders by region"
      />
    </div>
  );
};

/**
 * Collaboration scene, narrow cut: presence stack over the approval workflow —
 * a collaborator joins, then the release approval flips to approved. (The
 * comment beat lives in the standalone card, where the thread fits.)
 */
const CollabCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const s = collabAt(frame, cardInner.collab);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: "16px 24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-start", flexShrink: 0 }}>
        <LivePresenceStack users={s.users} label="Online now" />
      </div>
      <div style={{ ...panelShell, minHeight: 0 }}>
        <ApprovalWorkflow
          workflow={s.workflow}
          currentUserId="noah"
          now={COLLAB_NOW}
          compactCompleted
        />
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------- mosaic */

/**
 * MotiqShowcaseMosaic — 1600×1000. Five-card grid: stats (top-left), AI
 * Interface (top-right, wide), Developer Tools (bottom-left, large), Data
 * Motion (bottom-middle), Collaboration (bottom-right).
 *
 * Every card's hold phase has begun by `posterFrame`, so the static composite
 * is just this composition rendered at that frame — no separate still tree.
 */
export const MotiqShowcaseMosaic: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <PromoRoot>
      <ShowcaseField frame={frame} />
      <AbsoluteFill style={{ padding: 48, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 24, height: 380, flexShrink: 0 }}>
          <div style={{ ...cardShell, width: 560, flexShrink: 0 }}>
            <StatsCardScene />
          </div>
          <div style={{ ...cardShell, flex: 1, minWidth: 0 }}>
            <CardHead label={showcaseCopy.ai.label} sub={showcaseCopy.ai.sub} />
            <AiCardScene />
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, flex: 1, minHeight: 0 }}>
          <div style={{ ...cardShell, width: 620, flexShrink: 0 }}>
            <CardHead label={showcaseCopy.pipeline.label} sub={showcaseCopy.pipeline.sub} />
            <PipelineCardScene />
          </div>
          <div style={{ ...cardShell, width: 414, flexShrink: 0 }}>
            <CardHead label={showcaseCopy.data.label} sub={showcaseCopy.data.sub} />
            <DataCardScene />
          </div>
          <div style={{ ...cardShell, flex: 1, minWidth: 0 }}>
            <CardHead label={showcaseCopy.collab.label} sub={showcaseCopy.collab.subShort} />
            <CollabCardScene />
          </div>
        </div>
      </AbsoluteFill>
    </PromoRoot>
  );
};

/* ------------------------------------------------------- standalone cards */

const cardPhaseEnter = 8;

/**
 * Full-frame single-card stage (1200×750) for the per-workflow GIFs — same
 * visual language as a mosaic card, sized for README embedding.
 */
const CardStage: React.FC<{ label: string; sub: string; children: React.ReactNode }> = ({
  label,
  sub,
  children,
}) => {
  const frame = useCurrentFrame();
  const inP = rampE(frame, 0, cardPhaseEnter);
  return (
    <PromoRoot>
      <Atmosphere glow={0.38} />
      <AbsoluteFill
        style={{
          padding: "36px 48px 40px",
          display: "flex",
          flexDirection: "column",
          opacity: inP,
        }}
      >
        <div style={{ margin: "-20px -24px 0" }}>
          <CardHead label={label} sub={sub} size={19} />
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </PromoRoot>
  );
};

export const ShowcaseAiInterfaceCard: React.FC = () => (
  <CardStage label={showcaseCopy.ai.label} sub={showcaseCopy.ai.sub}>
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <AiCardScene width={1050} panelHeight={520} scale={1.04} />
    </div>
  </CardStage>
);

export const ShowcaseDeveloperToolsCard: React.FC = () => (
  <CardStage label={showcaseCopy.pipeline.label} sub={showcaseCopy.pipeline.sub}>
    <Zoom factor={1.02}>
      <PipelinePanel beats={cardInner.pipeline} width={680} maxHeight={560} />
    </Zoom>
  </CardStage>
);

export const ShowcaseDataMotionCard: React.FC = () => (
  <CardStage label={showcaseCopy.data.label} sub={showcaseCopy.data.sub}>
    <DataDashboard beats={cardInner.data} width={820} />
  </CardStage>
);

export const ShowcaseCollaborationCard: React.FC = () => (
  <CardStage label={showcaseCopy.collab.label} sub={showcaseCopy.collab.sub}>
    <CollabPanels beats={cardInner.collab} width={1040} />
  </CardStage>
);
