/**
 * Compact, bounded pack-preview adapters for the /packs overview cards.
 *
 * These are NOT the full block previews (those live in app/_previews/* and are
 * shown, one at a time, in the featured showcase). They are small, static,
 * readable-at-100% representative snapshots so every overview card stays the
 * same height with no internal scrolling and no miniaturized application screen.
 *
 * Server components (no client hooks). Motion is limited to Tailwind's
 * `motion-safe:animate-pulse` live dots — automatically disabled under reduced
 * motion — so nothing here needs a client boundary or a reduced-motion guard.
 */
import * as React from "react";

/* Shared chrome ------------------------------------------------------------ */

const FRAME =
  "flex h-[248px] w-full flex-col gap-2.5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5";

function LiveDot({ tone = "accent" }: { tone?: "accent" | "success" }) {
  const c = tone === "success" ? "var(--color-success)" : "var(--color-accent)";
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
        style={{ background: c }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: c }} />
    </span>
  );
}

function Avatar({ label, ring = "var(--color-bg-secondary)" }: { label: string; ring?: string }) {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-[var(--color-accent-fg)]"
      style={{
        background: "linear-gradient(135deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 60%, #000))",
        boxShadow: `0 0 0 2px ${ring}`,
      }}
    >
      {label}
    </span>
  );
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "success" | "accent" | "muted" }) {
  const map = {
    success: "text-[var(--color-success)] border-[color-mix(in_oklab,var(--color-success)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)]",
    accent: "text-[var(--color-accent-text)] border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)]",
    muted: "text-[var(--color-muted)] border-[var(--color-border)] bg-[var(--color-surface)]",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

/* AI Interface — short response, one tool step, one citation ---------------- */

export function AiInterfaceCompact() {
  return (
    <div className={FRAME} aria-hidden>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar label="AI" />
          <span className="text-[12.5px] font-medium text-[var(--color-fg)]">Assistant</span>
        </div>
        <StatusPill tone="accent">
          <LiveDot /> Streaming
        </StatusPill>
      </div>

      {/* one tool step */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--color-fg)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="var(--color-accent)" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          search_docs
        </span>
        <StatusPill tone="success">✓ done</StatusPill>
      </div>

      {/* short streamed response */}
      <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
        <p className="text-[12px] leading-relaxed text-[var(--color-fg)]">
          Q3 refunds are processed within 5 business days once approved
          <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-[var(--color-accent)] motion-safe:animate-pulse" />
        </p>
      </div>

      {/* one citation */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Source</span>
        <StatusPill tone="muted">
          <span className="text-[var(--color-accent-text)]">[1]</span> refund-policy.md
        </StatusPill>
      </div>
    </div>
  );
}

/* Developer Tools — environment, four stages, one log line ------------------ */

function Stage({ label, state }: { label: string; state: "done" | "active" | "todo" }) {
  const dot =
    state === "done"
      ? "bg-[var(--color-success)] border-[var(--color-success)]"
      : state === "active"
      ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_25%,transparent)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)]";
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${dot}`}>
        {state === "done" ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke="var(--color-success-foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : state === "active" ? (
          <LiveDot />
        ) : null}
      </span>
      <span className={`text-[10.5px] ${state === "todo" ? "text-[var(--color-muted)]" : "text-[var(--color-fg)]"}`}>{label}</span>
    </div>
  );
}

export function DeveloperToolsCompact() {
  return (
    <div className={FRAME} aria-hidden>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[12.5px] font-medium text-[var(--color-fg)]">acme / ledger-web</span>
        </div>
        <StatusPill tone="accent">Production</StatusPill>
      </div>

      {/* four deployment stages */}
      <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-3">
        <div className="absolute left-[16%] right-[16%] top-[22px] h-[2px] bg-[var(--color-border)]" />
        <div className="relative flex items-start">
          <Stage label="Build" state="done" />
          <Stage label="Test" state="done" />
          <Stage label="Deploy" state="active" />
          <Stage label="Live" state="todo" />
        </div>
      </div>

      {/* one log line */}
      <div className="mt-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2.5 py-2">
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-code-fg)]">
          <span className="text-[var(--color-success)]">✓</span>
          <span className="text-[var(--color-muted)]">12:04:31</span>
          deploying build a1f9c — <span className="text-[var(--color-fg)]">image pushed</span>
          <span className="ml-0.5 inline-block h-3 w-[2px] bg-[var(--color-accent)] motion-safe:animate-pulse" />
        </p>
      </div>
    </div>
  );
}

/* Collaboration — presence row, one approval stage, two comments ------------ */

export function CollaborationCompact() {
  return (
    <div className={FRAME} aria-hidden>
      {/* presence row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <Avatar label="SA" />
            <Avatar label="MP" />
            <Avatar label="KF" />
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--color-bg-secondary)] bg-[var(--color-surface)] text-[9.5px] font-semibold text-[var(--color-muted)]">
              +2
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11.5px] text-[var(--color-muted)]">
            <LiveDot tone="success" /> editing
          </span>
        </div>
      </div>

      {/* one approval stage */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-success)_16%,transparent)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[12px] font-medium text-[var(--color-fg)]">Design review</span>
        </div>
        <StatusPill tone="success">Approved</StatusPill>
      </div>

      {/* two comments */}
      <div className="flex flex-1 flex-col gap-1.5">
        {[
          { a: "SA", who: "Sana", t: "Ship it — spacing looks right now." },
          { a: "MP", who: "Milo", t: "Left one note on the empty state." },
        ].map((c) => (
          <div key={c.a} className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
            <Avatar label={c.a} ring="var(--color-surface)" />
            <div className="min-w-0">
              <span className="text-[11.5px] font-semibold text-[var(--color-fg)]">{c.who}</span>
              <p className="truncate text-[11.5px] text-[var(--color-muted)]">{c.t}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Data Motion — three KPIs, refresh status, five rows ----------------------- */

function Kpi({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2">
      <span className="text-[9.5px] uppercase tracking-wide text-[var(--color-muted)]">{label}</span>
      <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--color-fg)]">{value}</span>
      <span className={`text-[10px] font-medium ${up ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>{delta}</span>
    </div>
  );
}

export function DataMotionCompact() {
  const rows = [
    { s: "Checkout API", ok: true, v: "18.2k" },
    { s: "Auth Service", ok: true, v: "12.4k" },
    { s: "Search API", ok: false, v: "9.10k" },
    { s: "CDN Edge", ok: true, v: "31.2k" },
    { s: "Email Worker", ok: true, v: "6.20k" },
  ];
  return (
    <div className={FRAME} aria-hidden>
      {/* refresh status */}
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-[var(--color-fg)]">Live operations</span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
          <LiveDot tone="success" /> updated 2s ago
        </span>
      </div>

      {/* three KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Requests" value="135.7k" delta="+4.1%" up />
        <Kpi label="Latency" value="231ms" delta="-8ms" up />
        <Kpi label="Errors" value="0.35%" delta="+0.02" />
      </div>

      {/* five data rows */}
      <div className="flex-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        {rows.map((r, i) => (
          <div
            key={r.s}
            className={`flex items-center justify-between px-2.5 py-[6px] ${i > 0 ? "border-t border-[var(--color-border)]" : ""}`}
          >
            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-fg)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.ok ? "var(--color-success)" : "var(--color-error)" }} />
              {r.s}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-[var(--color-muted)]">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Slug → compact preview map ------------------------------------------------ */

export const compactPreviews: Record<string, React.ComponentType> = {
  "ai-interface": AiInterfaceCompact,
  "developer-tools": DeveloperToolsCompact,
  "collaboration": CollaborationCompact,
  "data-motion": DataMotionCompact,
};

export function CompactPreview({ slug }: { slug: string }) {
  const C = compactPreviews[slug];
  return C ? <C /> : null;
}
