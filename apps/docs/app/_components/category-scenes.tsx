import type { ReactNode } from "react";

import { CopperplateHatch } from "@/registry/backgrounds/copperplate-hatch";
import { DecryptText } from "@/registry/text/decrypt-text";

/* ------------------------------------------------------------------ *
 * Category scenes (docs/61 §catalog). Small, deliberately SIMPLIFIED
 * surfaces that stand for a whole catalog category on the homepage — one
 * representative state each, drawn from what that category's components
 * actually do. They are illustrations for a category card, not a claim
 * about one component: the live component previews live on the category
 * and component pages, where there is room to read them.
 *
 * Presentational only (no hooks) so these stay server components. All
 * motion is CSS keyframes declared in globals.css and collapsed by the
 * global reduced-motion rule.
 * ------------------------------------------------------------------ */

function Panel({ children, max, className }: { children: ReactNode; max?: number; className?: string }) {
  return (
    <div
      className={`relative z-[1] w-full overflow-hidden rounded-[14px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] ${className ?? ""}`}
      style={max ? { maxWidth: max } : undefined}
    >
      {children}
    </div>
  );
}

function PanelHead({ title, sub, status }: { title: string; sub?: string; status?: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-3.5 py-[11px]">
      <span className="text-[12.5px] font-semibold text-[var(--color-fg-secondary)]">{title}</span>
      {sub ? <span className="truncate font-mono text-[11px] text-[var(--color-subtle)]">{sub}</span> : null}
      {status ? (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-accent-text)]">
          <i className="cat-blink h-[5px] w-[5px] rounded-full bg-[var(--color-accent)]" />
          {status}
        </span>
      ) : null}
    </div>
  );
}

/** Skeleton copy line — the neutral filler inside scene surfaces. */
function Ln({ w, dim, tone, ml }: { w: string; dim?: boolean; tone?: string; ml?: number }) {
  return (
    <span
      className="block h-[7px] rounded-[4px]"
      style={{
        width: w,
        marginLeft: ml,
        background: tone ?? (dim ? "color-mix(in oklab, var(--color-fg) 7%, transparent)" : "color-mix(in oklab, var(--color-fg) 13%, transparent)"),
      }}
    />
  );
}

const CHECK = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- Developer console — a deployment in flight ---------- */
function PipeNode({ label, state }: { label: string; state: "done" | "active" | "todo" }) {
  const ring =
    state === "done"
      ? { borderColor: "color-mix(in oklab, var(--color-success) 60%, transparent)", color: "var(--color-success)", background: "color-mix(in oklab, var(--color-success) 10%, var(--color-surface))" }
      : state === "active"
        ? {
            borderColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            background: "var(--color-accent-soft)",
            boxShadow: "0 0 0 5px color-mix(in oklab, var(--color-accent) 15%, transparent), 0 0 18px color-mix(in oklab, var(--color-accent) 30%, transparent)",
          }
        : { borderColor: "var(--color-border-strong)", color: "var(--color-subtle)", background: "var(--color-surface)" };
  return (
    <span className="flex w-[64px] shrink-0 flex-col items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-full border-[1.5px]" style={ring}>
        {state === "done" ? (
          CHECK
        ) : state === "active" ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3v18M5 8l7-5 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </span>
      <span className="text-[11px] font-semibold text-[var(--color-muted)]">{label}</span>
    </span>
  );
}
function PipeLine({ fill, run }: { fill?: boolean; run?: boolean }) {
  return (
    <span
      className="relative mb-[21px] h-[2px] flex-1 overflow-hidden rounded-[2px]"
      style={{ background: fill ? "color-mix(in oklab, var(--color-success) 55%, var(--color-border-strong))" : "var(--color-border-strong)" }}
    >
      {run ? (
        <i
          className="cat-sweep absolute inset-y-0 left-0 w-[45%]"
          style={{ background: "linear-gradient(to right, transparent, var(--color-accent), transparent)" }}
        />
      ) : null}
    </span>
  );
}

export function DeveloperScene() {
  return (
    <Panel max={560}>
      <PanelHead title="production" sub="deploy #482 · main@e4f21c" status="Deploying" />
      <div className="flex items-center px-[18px] pb-2 pt-5">
        <PipeNode label="Build" state="done" />
        <PipeLine fill />
        <PipeNode label="Test" state="done" />
        <PipeLine run />
        <PipeNode label="Deploy" state="active" />
        <PipeLine />
        <PipeNode label="Verify" state="todo" />
      </div>
      <div className="mx-[18px] mb-3.5 flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-[9px] bg-[var(--color-bg-elevated)] px-[11px] py-2 font-mono text-[10.5px] text-[var(--color-muted)]">
        <span className="text-[var(--color-success)]">✓</span> pushed image registry/web:e4f21c · rolling out 3 of 8 replicas…
      </div>
    </Panel>
  );
}

/* ---------- Collaboration — a shared document, live ---------- */
function Avatar({ initials, color, live, first }: { initials: string; color: string; live?: boolean; first?: boolean }) {
  return (
    <span
      className={`relative grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-[var(--color-surface)] text-[10.5px] font-bold ${first ? "" : "-ml-2"}`}
      style={{ background: color, color: color.startsWith("var(") ? "var(--color-muted)" : "#fff" }}
    >
      {initials}
      {live ? <i className="cat-ring absolute -inset-[5px] rounded-full border-[1.5px] border-[var(--color-secondary-accent)]" /> : null}
    </span>
  );
}

export function CollaborationScene() {
  return (
    <Panel max={280}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[var(--color-secondary-accent-soft)] text-[var(--color-secondary-accent)]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 3h9l4 4v14H6z M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <b className="block truncate text-[12.5px] font-semibold text-[var(--color-fg-secondary)]">Q3 launch plan</b>
          <span className="text-[10.5px] text-[var(--color-subtle)]">7 online now</span>
        </span>
        <span className="ml-auto flex shrink-0">
          <Avatar initials="AK" color="#3e5ae8" first />
          <Avatar initials="MJ" color="#0e9488" live />
          <Avatar initials="RS" color="#b45309" />
          <Avatar initials="+4" color="var(--color-surface-strong)" />
        </span>
      </div>
      <div className="flex flex-col gap-[9px] px-4 pb-4 pt-1">
        <Ln w="88%" />
        <Ln w="72%" dim />
        <span className="flex items-center gap-2">
          <span className="rounded-[4px_4px_4px_0] bg-[#0e9488] px-1.5 py-[1.5px] text-[9.5px] font-bold text-white">Mira</span>
          <Ln w="44%" tone="color-mix(in oklab, #0e9488 35%, transparent)" />
        </span>
        <Ln w="60%" dim />
      </div>
    </Panel>
  );
}

/* ---------- File workflows — a queue mid-upload ---------- */
function UploadRow({ kind, name, pct, state }: { kind: string; name: string; pct?: number; state: "done" | "active" | "queued" }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-[11px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-[9px] ${state === "queued" ? "opacity-60" : ""}`}>
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[9.5px] font-bold text-[var(--color-accent-text)]">{kind}</span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[11.5px] font-semibold text-[var(--color-fg-secondary)]">{name}</b>
        {state === "active" ? (
          <span className="mt-[5px] block h-1 overflow-hidden rounded bg-[var(--color-surface-strong)]">
            <i className="cat-grow block h-full rounded bg-[var(--color-accent)]" />
          </span>
        ) : null}
      </span>
      <span className={`shrink-0 text-[10.5px] tabular-nums ${state === "done" ? "text-[var(--color-success)]" : "text-[var(--color-muted)]"}`}>
        {state === "done" ? "✓ Done" : state === "queued" ? "Queued" : `${pct}%`}
      </span>
    </div>
  );
}

export function FileScene() {
  return (
    <Panel max={280}>
      <PanelHead title="Uploading 3 files" status="2 of 3" />
      <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
        <UploadRow kind="PDF" name="brand-guidelines.pdf" state="done" />
        <UploadRow kind="PNG" name="hero-cover@2x.png" state="active" pct={64} />
        <UploadRow kind="ZIP" name="assets-export.zip" state="queued" />
      </div>
    </Panel>
  );
}

/* ---------- Security & accounts — a passkey confirmation ---------- */
export function SecurityScene() {
  return (
    <Panel max={250}>
      <div className="px-5 pb-[18px] pt-[22px] text-center">
        <span
          className="mx-auto mb-3 grid h-[58px] w-[58px] place-items-center rounded-[17px] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]"
          style={{ border: "1px solid color-mix(in oklab, var(--color-accent) 34%, transparent)", boxShadow: "0 0 26px color-mix(in oklab, var(--color-accent) 22%, transparent)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6zM9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <b className="block text-[13px] font-semibold text-[var(--color-fg-secondary)]">Confirm with Touch ID</b>
        <span className="mt-[3px] block text-[11px] text-[var(--color-subtle)]">Your passkey stays on this device</span>
        <span className="mx-auto mt-[13px] block w-fit rounded-[9px] bg-[var(--color-accent)] px-[18px] py-[7px] text-[11.5px] font-semibold text-[var(--color-accent-fg)]">
          Continue
        </span>
        <span className="mt-[13px] flex justify-center gap-[5px]">
          {[true, true, false, false].map((on, i) => (
            <i key={i} className="h-[3.5px] w-[26px] rounded" style={{ background: on ? "var(--color-accent)" : "var(--color-surface-strong)" }} />
          ))}
        </span>
      </div>
    </Panel>
  );
}

/* ---------- Productivity — a board mid-drag ---------- */
function KCard({ lines, lift }: { lines: string[]; lift?: boolean }) {
  return (
    <div
      className={`mb-1.5 rounded-lg border bg-[var(--color-surface)] px-2 py-[7px] ${lift ? "cat-lift shadow-[var(--shadow-md)]" : ""}`}
      style={{ borderColor: lift ? "var(--fam)" : "var(--color-border)" }}
    >
      {lines.map((w, i) => (
        <span key={i} className={i ? "mt-[5px] block" : "block"}>
          <Ln w={w} dim={i > 0} />
        </span>
      ))}
    </div>
  );
}

export function ProductivityScene() {
  return (
    <Panel max={300}>
      <div className="flex gap-[9px] p-3.5">
        {[
          { h: "To do", dot: "var(--fam)", cards: [["80%", "55%"], ["65%"]], slot: false },
          { h: "Doing", dot: "#3e5ae8", cards: [["85%", "48%"]], slot: true },
          { h: "Done", dot: "var(--color-success)", cards: [["70%"]], slot: false },
        ].map((col) => (
          <div key={col.h} className="min-w-0 flex-1 rounded-[11px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2">
            <h5 className="mx-0.5 mb-2 mt-px flex items-center gap-[5px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
              <i className="h-[5px] w-[5px] rounded-full" style={{ background: col.dot }} />
              {col.h}
            </h5>
            {col.slot ? (
              <div
                className="mb-1.5 h-[30px] rounded-lg"
                style={{ border: "1.5px dashed color-mix(in oklab, var(--fam) 45%, transparent)", background: "color-mix(in oklab, var(--fam) 6%, transparent)" }}
              />
            ) : null}
            {col.cards.map((lines, i) => (
              <KCard key={i} lines={lines} lift={col.slot && i === 0} />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- Text animations — the real Decrypt Text, headline + terminal ----------
   The one scene that IS a live registry component: it needs no controls or
   fixture data to read, so the category is shown by the thing itself. */
export function TextScene() {
  return (
    <div className="relative z-[1] flex w-full flex-col items-center gap-4 text-center">
      <DecryptText
        text="Ship interfaces that feel alive."
        // decorative inside a card — the card's own <h3> is the heading here
        as="div"
        trigger="inview"
        loop={7000}
        seed={7}
        className="text-[clamp(24px,3.2vw,40px)] font-bold tracking-[-0.022em] text-[var(--color-fg)]"
      />
      <DecryptText
        text="motiq add decrypt-text — resolved in 84ms"
        variant="terminal"
        trigger="inview"
        startDelay={900}
        loop={7000}
        seed={13}
        className="w-auto"
      />
    </div>
  );
}

/* ---------- Workflow heroes — copy + CTAs beside a live agent run ---------- */
export function HeroBlockScene() {
  return (
    <div
      className="absolute inset-0 grid grid-cols-[1fr_1.05fr] items-center gap-3 py-[22px] pl-[22px] pr-[18px]"
      style={{ background: "radial-gradient(80% 100% at 85% 0%, color-mix(in oklab, var(--color-accent) 10%, transparent), transparent 65%)" }}
    >
      <div>
        <span className="mb-[7px] block h-[11px] w-[92%] rounded-[6px]" style={{ background: "color-mix(in oklab, var(--color-fg) 24%, transparent)" }} />
        <span className="mb-[7px] block h-[11px] w-[66%] rounded-[6px]" style={{ background: "color-mix(in oklab, var(--color-fg) 24%, transparent)" }} />
        <span className="mt-[9px] block h-[7px] w-[84%] rounded-[6px]" style={{ background: "color-mix(in oklab, var(--color-fg) 10%, transparent)" }} />
        <span className="mt-[11px] flex gap-[7px]">
          <i className="h-[21px] w-[68px] rounded-[7px] bg-[var(--color-accent)] opacity-95" />
          <i className="h-[21px] w-[68px] rounded-[7px] border border-[var(--color-border-strong)]" />
        </span>
      </div>
      <div className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-[11px] py-2.5 shadow-[var(--shadow-md)]">
        {[
          { s: "done", label: "Plan research", tool: null },
          { s: "act", label: "Tool call", tool: "search_docs()" },
          { s: "todo", label: "Await approval", tool: null },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-2 py-[5px]">
            <span
              className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] text-[10px] ${step.s === "act" ? "cat-blink" : ""}`}
              style={
                step.s === "done"
                  ? { borderColor: "color-mix(in oklab, var(--color-success) 60%, transparent)", color: "var(--color-success)", background: "var(--color-surface)" }
                  : step.s === "act"
                    ? { borderColor: "var(--color-accent)", color: "var(--color-accent-text)", background: "var(--color-accent-soft)", boxShadow: "0 0 0 3.5px color-mix(in oklab, var(--color-accent) 15%, transparent)" }
                    : { borderColor: "var(--color-border-strong)", color: "var(--color-subtle)", background: "var(--color-surface)" }
              }
            >
              {step.s === "done" ? "✓" : step.s === "act" ? "●" : "○"}
            </span>
            <b className={`whitespace-nowrap text-[10.5px] font-semibold ${step.s === "act" ? "text-[var(--color-fg)]" : "text-[var(--color-fg-secondary)]"}`}>{step.label}</b>
            {step.tool ? (
              <span className="ml-auto whitespace-nowrap rounded-[5px] bg-[var(--color-accent-soft)] px-1.5 py-[2px] font-mono text-[9px] text-[var(--color-accent-text)]">
                {step.tool}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Ambient backgrounds — the real Copperplate Hatch ----------
   The engraver's cross-hatch plate, rendered live rather than evoked. It
   commits to a fixed dark palette by design (see its brief), so this one card
   stays dark in the light theme — that is the component, not a theming bug. */
export function AmbientScene() {
  return (
    <span className="absolute inset-0 block">
      <CopperplateHatch
        className="h-full w-full"
        // thinned for card scale — at full density the plate reads as noise in
        // a ~350px cell instead of legible engraving
        density={0.55}
        intensity={1.1}
        focalPoint={[{ x: 0.68, y: 0.3 }]}
        seed={11}
        pauseWhenHidden
      />
    </span>
  );
}
