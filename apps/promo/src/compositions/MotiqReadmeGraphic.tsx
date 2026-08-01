import React from "react";
import { AbsoluteFill } from "remotion";

import { AiResponseStream } from "@/registry/ai/ai-response-stream";
import { LivePresenceStack } from "@/registry/collaboration/live-presence-stack";
import { KpiNumberMorph } from "@/registry/data/kpi-number-morph";

import { agentAt } from "../adapters/agent";
import { collabAt } from "../adapters/collab";
import { dashboardAt } from "../adapters/dashboard";
import { claims, installCommand } from "../campaign";
import { STREAM_SOURCES } from "../data/agent";
import { PIPELINE_BASE } from "../data/pipeline";
import { monoFamily } from "../theme/fonts";
import { PromoRoot, Wordmark } from "../theme/stage";

/** Fixed snapshots of the fictional workflow data used by the animated campaign. */
const settledAgent = agentAt(0, {
  promptStart: -120,
  promptSubmit: -100,
  runStart: -90,
  toolMetricsDone: -72,
  toolDeploysDone: -54,
  approvalAsk: -44,
  approvalOk: -30,
  streamStart: -26,
  streamEnd: -1,
});
const settledDashboard = dashboardAt(0, { refreshStart: -30, refreshEnd: -1 });
const settledCollab = collabAt(0, { join: -20, comment: -10, approve: -1 });

const TECH = ["React", "TypeScript", "Tailwind CSS", "shadcn-compatible"] as const;
const GUARANTEES = ["Accessible", "Reduced-motion safe", "Editable source", "MIT"] as const;

const Check: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotGrid: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.22,
      backgroundImage: "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-accent) 34%, transparent) 1px, transparent 0)",
      backgroundSize: "24px 24px",
      maskImage: "linear-gradient(to bottom, black, transparent 82%)",
      WebkitMaskImage: "linear-gradient(to bottom, black, transparent 82%)",
    }}
  />
);

const TechChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      border: "1px solid var(--color-border)",
      borderRadius: 999,
      padding: "5px 10px",
      background: "color-mix(in oklab, var(--color-surface) 78%, transparent)",
      color: "var(--color-fg-secondary)",
      fontFamily: monoFamily,
      fontSize: 10.5,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const PanelLabel: React.FC<{
  eyebrow: string;
  title: string;
  status?: string;
  tone?: "accent" | "success";
}> = ({ eyebrow, title, status, tone = "accent" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ color: "var(--color-accent-text)", fontFamily: monoFamily, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase" }}>
        {eyebrow}
      </div>
      <div style={{ marginTop: 3, color: "var(--color-fg)", fontSize: 14, fontWeight: 650, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </div>
    </div>
    {status ? (
      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, border: `1px solid color-mix(in oklab, var(--color-${tone}) 48%, transparent)`, borderRadius: 999, padding: "4px 8px", background: `color-mix(in oklab, var(--color-${tone}) 12%, transparent)`, color: `var(--color-${tone})`, fontSize: 10.5, fontWeight: 650 }}>
        <Check size={11} />
        {status}
      </span>
    ) : null}
  </div>
);

const ProductShell: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      background: "linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 94%, var(--color-accent) 6%), var(--color-bg-secondary))",
      boxShadow: "0 24px 80px -36px rgba(0, 3, 10, 0.9)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Condensed, faithful timeline surface so all five real run steps fit at README size. */
const AgentExecutionSummary: React.FC = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "13px 14px 11px", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, flexShrink: 0, borderRadius: 999, background: "color-mix(in oklab, var(--color-success) 18%, var(--color-surface))", color: "var(--color-success)" }}>
          <Check size={15} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--color-fg)", fontSize: 13, fontWeight: 650, lineHeight: 1.25 }}>Investigate checkout latency spike</div>
          <div style={{ marginTop: 3, color: "var(--color-muted)", fontFamily: monoFamily, fontSize: 9.5 }}>agent run · 5 of 5 steps</div>
        </div>
      </div>
      <div style={{ height: 3, marginTop: 10, overflow: "hidden", borderRadius: 999, background: "var(--color-border)" }}>
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, var(--color-success), var(--color-secondary-accent))" }} />
      </div>
    </div>
    <div style={{ display: "grid", flex: 1, padding: "7px 10px 9px" }}>
      {settledAgent.run.steps.map((step, index) => (
        <div key={step.id} style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr) auto", alignItems: "center", gap: 7, minHeight: 46, borderBottom: index < settledAgent.run.steps.length - 1 ? "1px solid color-mix(in oklab, var(--color-border) 72%, transparent)" : "none" }}>
          <span style={{ display: "grid", placeItems: "center", width: 21, height: 21, borderRadius: 999, border: "1px solid color-mix(in oklab, var(--color-success) 54%, transparent)", background: "color-mix(in oklab, var(--color-success) 10%, transparent)", color: "var(--color-success)" }}>
            <Check size={10} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-fg-secondary)", fontSize: 11.5, fontWeight: 600 }}>
              <span style={{ marginRight: 7, color: "var(--color-subtle)", fontFamily: monoFamily, fontSize: 9.5 }}>{String(index + 1).padStart(2, "0")}</span>
              {step.title}
            </div>
            {step.toolCall ? (
              <div style={{ marginTop: 2, color: "var(--color-accent-text)", fontFamily: monoFamily, fontSize: 8.5 }}>{step.toolCall.name}</div>
            ) : step.id === "approve" ? (
              <div style={{ marginTop: 2, color: "var(--color-accent-text)", fontFamily: monoFamily, fontSize: 8.5 }}>human approval granted</div>
            ) : null}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-success)", fontSize: 9, fontWeight: 650 }}>
            <Check size={9} /> {step.id === "approve" ? "Approved" : "Done"}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const PipelineSummary: React.FC = () => (
  <ProductShell style={{ height: 194, padding: "14px 16px 12px" }}>
    <PanelLabel eyebrow="Developer tools" title="Production deploy" status="Recovered" tone="success" />
    <div style={{ marginTop: 9, display: "grid", gap: 5 }}>
      {PIPELINE_BASE.map((stage, index) => (
        <div key={stage.id} style={{ position: "relative", display: "grid", gridTemplateColumns: "22px minmax(0, 1fr) auto", alignItems: "center", gap: 8, minHeight: 28 }}>
          {index < PIPELINE_BASE.length - 1 ? (
            <span aria-hidden style={{ position: "absolute", left: 10, top: 21, width: 1, height: 16, background: "color-mix(in oklab, var(--color-success) 55%, var(--color-border))" }} />
          ) : null}
          <span style={{ position: "relative", zIndex: 1, display: "grid", placeItems: "center", width: 21, height: 21, borderRadius: 999, border: "1px solid color-mix(in oklab, var(--color-success) 68%, transparent)", background: "color-mix(in oklab, var(--color-success) 12%, var(--color-bg-secondary))", color: "var(--color-success)" }}>
            <Check size={11} />
          </span>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-fg-secondary)", fontSize: 11.5, fontWeight: 550 }}>
            {stage.name}
          </span>
          <span style={{ color: "var(--color-muted)", fontFamily: monoFamily, fontSize: 9.5, fontVariantNumeric: "tabular-nums" }}>
            {(stage.durationMs / 1000).toFixed(1)}s
          </span>
        </div>
      ))}
    </div>
  </ProductShell>
);

const OperationsSummary: React.FC = () => (
  <ProductShell style={{ height: 140, padding: "12px 14px" }}>
    <PanelLabel eyebrow="Live operations" title="Checkout health" status="Updated" tone="success" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 7 }}>
      <KpiNumberMorph label="Conversion" value={settledDashboard.kpiValues.conversion} suffix="%" decimals={2} state="idle" style={{ padding: 8, height: 72, overflow: "hidden" }} />
      <KpiNumberMorph label="Checkout p95" value={settledDashboard.kpiValues.latency} suffix=" ms" state="idle" style={{ padding: 8, height: 72, overflow: "hidden" }} />
    </div>
  </ProductShell>
);

const CollaborationSummary: React.FC = () => (
  <ProductShell style={{ height: 84, padding: "8px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-fg-secondary)", fontSize: 11, fontWeight: 650 }}>Release 24.7.2</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-success)", fontSize: 10.5, fontWeight: 650 }}>
        <Check size={11} /> Approved
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--color-border)" }}>
      <LivePresenceStack users={settledCollab.users} label="Online now" />
      <span style={{ marginLeft: "auto", color: "var(--color-muted)", fontFamily: monoFamily, fontSize: 9.5, whiteSpace: "nowrap" }}>3 online</span>
    </div>
  </ProductShell>
);

/** Static README artwork, designed on a 1280×720 logical stage and rendered at 2×. */
export const MotiqReadmeGraphic: React.FC = () => (
  <PromoRoot>
    <AbsoluteFill style={{ width: 1280, height: 720, transform: "scale(2)", transformOrigin: "top left" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 48% at 18% -8%, color-mix(in oklab, var(--color-accent) 20%, transparent), transparent 68%), radial-gradient(ellipse 44% 50% at 92% 18%, color-mix(in oklab, var(--color-secondary-accent) 10%, transparent), transparent 72%), var(--color-bg)" }} />
      <DotGrid />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 0, color-mix(in oklab, var(--color-border) 24%, transparent) 50%, transparent 100%)", height: 1, top: 188 }} />

      <div style={{ position: "relative", height: "100%", padding: "30px 42px 24px" }}>
        <header style={{ height: 148, display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: 44 }}>
          <div>
            <Wordmark size={34} />
            <h1 style={{ margin: "14px 0 0", maxWidth: 660, color: "var(--color-fg)", fontSize: 29, lineHeight: 1.07, fontWeight: 730, letterSpacing: -0.85 }}>
              Animated React components for product interfaces that <span style={{ color: "var(--color-signature-text)" }}>feel alive.</span>
            </h1>
            <p style={{ margin: "8px 0 0", color: "var(--color-muted)", fontSize: 13, lineHeight: 1.4 }}>Editable source. Real workflows. Ready to ship.</p>
          </div>

          <div style={{ paddingTop: 2 }}>
            <div style={{ border: "1px solid var(--color-border-strong)", borderRadius: 12, background: "color-mix(in oklab, var(--color-code-bg) 92%, transparent)", padding: "11px 14px 12px", boxShadow: "var(--shadow-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--color-muted)", fontFamily: monoFamily, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-success)" }} /> Install editable source
              </div>
              <div style={{ marginTop: 8, color: "var(--color-code-fg)", fontFamily: monoFamily, fontSize: 11.5, lineHeight: 1.3, whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--color-success)", fontWeight: 700 }}>$ </span>{installCommand}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              {TECH.map((item) => <TechChip key={item}>{item}</TechChip>)}
            </div>
          </div>
        </header>

        <main style={{ height: 438, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 310px", gap: 14 }}>
          <ProductShell style={{ position: "relative" }}>
            <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 17px", borderBottom: "1px solid var(--color-border)", background: "color-mix(in oklab, var(--color-bg-secondary) 88%, transparent)" }}>
              <div style={{ display: "flex", gap: 6 }} aria-hidden>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-error)" }} />
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-warning)" }} />
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-success)" }} />
              </div>
              <div style={{ marginLeft: 14, minWidth: 0 }}>
                <div style={{ color: "var(--color-fg-secondary)", fontSize: 12.5, fontWeight: 650, letterSpacing: -0.1 }}>Incident investigator</div>
                <div style={{ marginTop: 2, color: "var(--color-muted)", fontFamily: monoFamily, fontSize: 9.5 }}>checkout-api / run_8123</div>
              </div>
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid color-mix(in oklab, var(--color-success) 42%, transparent)", borderRadius: 999, padding: "5px 9px", background: "color-mix(in oklab, var(--color-success) 10%, transparent)", color: "var(--color-success)", fontSize: 10.5, fontWeight: 650 }}>
                <Check size={11} /> Run complete
              </span>
            </div>

            <div style={{ height: 341, display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: 11, padding: 11 }}>
              <div style={{ minWidth: 0, height: "100%", overflow: "hidden", border: "1px solid var(--color-border)", borderRadius: 12, background: "var(--color-bg-secondary)" }}>
                <AgentExecutionSummary />
              </div>
              <div style={{ minWidth: 0, height: "100%", overflow: "hidden", border: "1px solid var(--color-border)", borderRadius: 12, background: "var(--color-bg-secondary)" }}>
                <AiResponseStream segments={settledAgent.segments} state={settledAgent.streamState} sources={STREAM_SOURCES} assistantName="Assistant" caret={false} />
              </div>
            </div>

            <div style={{ height: 45, display: "flex", alignItems: "center", padding: "0 16px", borderTop: "1px solid var(--color-border)", color: "var(--color-muted)", fontFamily: monoFamily, fontSize: 9.5 }}>
              5 steps&nbsp;&nbsp;·&nbsp;&nbsp;3 tool calls&nbsp;&nbsp;·&nbsp;&nbsp;2 cited sources
              <span style={{ marginLeft: "auto", color: "var(--color-success)" }}>Application-controlled state</span>
            </div>
          </ProductShell>

          <aside style={{ display: "grid", gridTemplateRows: "194px 140px 84px", gap: 10 }}>
            <PipelineSummary />
            <OperationsSummary />
            <CollaborationSummary />
          </aside>
        </main>

        <footer style={{ height: 80, display: "flex", alignItems: "center", gap: 18, padding: "0 2px" }}>
          <span style={{ color: "var(--color-fg-secondary)", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{claims.components} · 8 workflow blocks · 4 packs</span>
          <span style={{ width: 1, height: 18, background: "var(--color-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {GUARANTEES.map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--color-muted)", fontSize: 10.5, whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--color-success)", display: "inline-flex" }}><Check size={11} /></span>{item}
              </span>
            ))}
          </div>
          <span style={{ marginLeft: "auto", color: "var(--color-accent-text)", fontFamily: monoFamily, fontSize: 10.5, fontWeight: 600 }}>motiq.dev</span>
        </footer>
      </div>
    </AbsoluteFill>
  </PromoRoot>
);
