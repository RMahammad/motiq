"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  resolveComposition,
  compositionScrimStyle,
  labelHiddenAt,
  contentFalloff,
  type ContentPlacement,
} from "@/lib/motionstack";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TopologyNodeStatus =
  | "idle"
  | "pending"
  | "active"
  | "completed"
  | "failed";

export interface TopologyNode {
  /** Stable id referenced by connections and the active/failed sets. */
  id: string;
  /** 0–1 horizontal position. Omit to auto-place by declaration order. */
  x?: number;
  /** 0–1 vertical position. Omit to auto-place by declaration order. */
  y?: number;
  /** Lifecycle status — drives the glyph, ring, and emphasis (never color alone). */
  status?: TopologyNodeStatus;
  /** Optional grouping id — same group shares a faint enclosure tint. */
  group?: string;
  /** Optional short label rendered beside the node (kept restrained). */
  label?: string;
}

export interface TopologyConnection {
  /** Optional id so it can be listed in `activeConnectionIds`. */
  id?: string;
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
}

export interface TopologyRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface WorkflowTopologyFieldProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Application-defined workflow nodes. Omit to render a deterministic default topology. */
  nodes?: TopologyNode[];
  /** Application-defined directed connections between nodes. */
  connections?: TopologyConnection[];
  /** Ids of nodes on the live path (forces status → active unless already failed/completed). */
  activeNodeIds?: string[];
  /** Ids (or "from>to") of connections on the live path — these animate directional flow. */
  activeConnectionIds?: string[];
  /**
   * Where the foreground content sits. The topology runs full-bleed and a
   * frosted-glass scrim behind the copy keeps it readable — the one prop needed
   * for a readable hero, with no hard edge and the field visible on every side
   * (including center and full-bleed behind the copy on mobile). "none" = a plain
   * full-bleed field with no scrim.
   */
  contentPlacement?: ContentPlacement;
  /** Extra ramp width (0–1) over which the topology's softening eases past the content. */
  safeAreaPadding?: number;
  /** How strongly the topology softens behind content (0–1). */
  safeAreaStrength?: number;
  /** Show node labels. Default true (auto-hidden near content). */
  showLabels?: boolean;
  /** Hide labels that fall inside/near the readable region. Default true. */
  hideLabelsNearContent?: boolean;
  /** Region where the topology thins so foreground text stays readable (0–1 coords). */
  safeArea?: TopologyRect;
  /** Background-lattice density multiplier (~0.4–1.6). */
  density?: number;
  /** Number of parallax lattice layers behind the topology (0–3). */
  depth?: number;
  /** Overall luminance/opacity of the field (0–1.4). */
  intensity?: number;
  /** Flow speed multiplier for active connections. 0 stops flow (still legible). */
  speed?: number;
  /** Pointer highlights the nearest node + its edges (never the sole effect). */
  interactive?: boolean;
  /** Pause flow + lattice drift when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Deterministic seed for the generated lattice + default topology (SSR-stable). */
  seed?: number;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic geometry                                                     */
/* -------------------------------------------------------------------------- */

/** SSR default logical field size; the live viewBox tracks the measured container. */
const W = 1200;
const H = 760;

/** mulberry32 — no Math.random / Date.now at render (SSR-stable). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface Size {
  w: number;
  h: number;
}

/** Where the topology sits inside the field (0–1). Full-bleed on every placement:
 *  the topology spans the whole frame so nodes over the copy read as soft glowing
 *  tokens behind the frosted scrim (not masked away) — visible on every side,
 *  including center, and full-bleed behind the copy on mobile. */
interface MapBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
function mapBox(_placement: ContentPlacement): MapBox {
  return { x: 0.04, y: 0.08, w: 0.92, h: 0.84 };
}

interface PlacedNode {
  id: string;
  /** Base 0–1 position (pre-projection). */
  nx: number;
  ny: number;
  /** Projected 0–1 position inside the field (after mapBox relocation). */
  fx: number;
  fy: number;
  /** Projected position in field pixels. */
  px: number;
  py: number;
  status: TopologyNodeStatus;
  group?: string;
  label?: string;
}

interface PlacedEdge {
  id: string;
  d: string;
  /** Approximate length for dash animation. */
  len: number;
  active: boolean;
  /** Both endpoints completed → the edge is a settled/completed path. */
  settled: boolean;
  /** Either endpoint failed → non-color failure treatment. */
  failed: boolean;
  /** Midpoint (0–1 field coords) for the behind-copy softening pass. */
  mx: number;
  my: number;
}

interface LatticeDot {
  /** 0–1 position; projected to the live field at render. */
  x: number;
  y: number;
  r: number;
  o: number;
}

interface LatticeLayer {
  dots: LatticeDot[];
  dx: number;
  dy: number;
  dur: number;
}

/** A layered DAG that reads as a real pipeline: completed → active → pending, one failure. */
function defaultTopology(): { nodes: TopologyNode[]; connections: TopologyConnection[] } {
  const cols = [
    { x: 0.14, ys: [0.34, 0.62], status: "completed" as const },
    { x: 0.34, ys: [0.24, 0.5, 0.76], status: "completed" as const },
    { x: 0.54, ys: [0.4, 0.66], status: "active" as const },
    { x: 0.73, ys: [0.28, 0.54, 0.8], status: "pending" as const },
    { x: 0.9, ys: [0.44, 0.7], status: "pending" as const },
  ];
  const nodes: TopologyNode[] = [];
  cols.forEach((c, ci) =>
    c.ys.forEach((y, ri) => {
      const id = `n${ci}-${ri}`;
      let status: TopologyNodeStatus = c.status;
      if (ci === 3 && ri === 1) status = "failed"; // one clearly-marked failure
      if (ci === 2 && ri === 1) status = "pending"; // active column has one waiting sibling
      nodes.push({ id, x: c.x, y, status, group: `g${ci}` });
    }),
  );
  const connections: TopologyConnection[] = [];
  const link = (a: string, b: string) => connections.push({ id: `${a}>${b}`, from: a, to: b });
  // completed chain
  link("n0-0", "n1-0"); link("n0-0", "n1-1"); link("n0-1", "n1-1"); link("n0-1", "n1-2");
  // into the active node
  link("n1-0", "n2-0"); link("n1-1", "n2-0"); link("n1-1", "n2-1"); link("n1-2", "n2-1");
  // active → pending fan-out
  link("n2-0", "n3-0"); link("n2-0", "n3-1"); link("n2-1", "n3-1"); link("n2-1", "n3-2");
  // pending tail
  link("n3-0", "n4-0"); link("n3-2", "n4-1"); link("n3-1", "n4-0");
  return { nodes, connections };
}

/** Base 0–1 placement (auto-grid for coordinate-less nodes), before mapBox projection. */
function place(nodes: TopologyNode[]): Map<string, PlacedNode> {
  const map = new Map<string, PlacedNode>();
  nodes.forEach((n, i) => {
    // Auto-place nodes lacking coordinates on a gentle grid by declaration order.
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const gx = (i % cols) / Math.max(1, cols - 1);
    const gy = Math.floor(i / cols) / Math.max(1, Math.ceil(nodes.length / cols) - 1);
    const nx = clamp(n.x ?? gx, 0, 1);
    const ny = clamp(n.y ?? gy, 0, 1);
    map.set(n.id, {
      id: n.id,
      nx,
      ny,
      fx: nx,
      fy: ny,
      px: round1(nx * W),
      py: round1(ny * H),
      status: n.status ?? "idle",
      group: n.group,
      label: n.label,
    });
  });
  return map;
}

/** Cubic curve between two placed nodes (field pixels) with a slight horizontal S. */
function edgePath(a: PlacedNode, b: PlacedNode): { d: string; len: number } {
  const dx = b.px - a.px;
  const c1x = a.px + dx * 0.5;
  const c2x = b.px - dx * 0.5;
  const d = `M ${a.px} ${a.py} C ${round1(c1x)} ${a.py}, ${round1(c2x)} ${b.py}, ${b.px} ${b.py}`;
  const len = Math.hypot(dx, b.py - a.py) * 1.12 + Math.abs(a.py - b.py) * 0.2;
  return { d, len: Math.max(40, round1(len)) };
}

function buildLattice(seed: number, depth: number, density: number, safe: TopologyRect): LatticeLayer[] {
  const layers: LatticeLayer[] = [];
  const n = clamp(Math.round(depth), 0, 3);
  for (let li = 0; li < n; li++) {
    const rng = makeRng((seed >>> 0) * 2654435761 + li * 40503 + 7);
    const count = Math.round((26 + density * 20) * (1 - li * 0.18));
    const dots: LatticeDot[] = [];
    for (let k = 0; k < count; k++) {
      const x = rng();
      const y = rng();
      // Thin the lattice inside the safe area so it never crowds foreground text.
      const inSafe = x > safe.x && x < safe.x + safe.w && y > safe.y && y < safe.y + safe.h;
      if (inSafe && rng() < 0.7) continue;
      dots.push({
        x: round1(x * 1000) / 1000,
        y: round1(y * 1000) / 1000,
        r: round1(1 + rng() * 1.6 * (1 - li * 0.2)),
        o: round1(clamp((0.16 - li * 0.045) * (0.5 + rng() * 0.5), 0.03, 0.2)),
      });
    }
    const dir = li % 2 === 0 ? -1 : 1;
    layers.push({
      dots,
      dx: round1(dir * (10 - li * 3)),
      dy: round1(-(5 - li * 1.2)),
      dur: round1(22 + li * 8),
    });
  }
  return layers;
}

interface Mote {
  /** 0–1 position across the WHOLE field (not the topology box). */
  x: number;
  y: number;
  r: number;
  /** Base opacity before intensity + content falloff. */
  o: number;
  /** Warm (accent) vs cool (cyan) tint. */
  warm: boolean;
  /** Deterministic twinkle timing. */
  delay: number;
  dur: number;
}

/**
 * A dense scatter of faint signal motes that fills the whole field so no corner
 * reads as dead space. Deterministic (seeded), twinkles slowly, and is quieted
 * behind the copy by the same content falloff as everything else.
 */
function buildMotes(seed: number, density: number): Mote[] {
  const rng = makeRng((seed >>> 0) * 0x85ebca6b + 0x27d4eb2f);
  const count = clamp(Math.round(58 + density * 18), 40, 96);
  const motes: Mote[] = [];
  for (let k = 0; k < count; k++) {
    motes.push({
      x: round1(rng() * 1000) / 1000,
      y: round1(rng() * 1000) / 1000,
      r: round1(0.6 + rng() * 1.5),
      o: round1(0.1 + rng() * 0.26),
      warm: rng() > 0.7,
      delay: round1(rng() * 6),
      dur: round1(3.4 + rng() * 4.2),
    });
  }
  return motes;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * WorkflowTopologyField — an atmospheric background that renders an
 * application-defined workflow as a topology: nodes with lifecycle status,
 * directed connections, an animated *active path* (directional dash flow),
 * quietly-settled completed paths, and failed nodes marked with a ring + glyph
 * (never color alone). A parallax lattice sits behind it for atmosphere when no
 * labels are shown. The field runs full-bleed on every placement: nodes span the
 * whole frame and those over the copy linger as soft glowing tokens (not masked
 * away) while a frosted-glass scrim behind the copy keeps the text readable — so
 * the topology is visible on every side, including center, and full-bleed behind
 * the copy on mobile. The viewBox tracks the measured container (via
 * ResizeObserver, desktop default at SSR) so the field never crops on tall mobile
 * frames and nodes keep a legible pixel size. SVG paths + CSS/WAAPI only — no
 * canvas, no WebGL, no per-frame React state, and no `Math.random`/`Date.now` at
 * render, so server and client render identical markup. Decorative: renders
 * `children` as foreground content over the scrim. Clean-room original — not a
 * generic node graph or a port of any beams/constellation effect.
 */
export function WorkflowTopologyField({
  nodes,
  connections,
  activeNodeIds,
  activeConnectionIds,
  contentPlacement = "none",
  safeAreaPadding,
  safeAreaStrength,
  showLabels = true,
  hideLabelsNearContent = true,
  safeArea,
  density = 1,
  depth = 2,
  intensity = 1,
  speed = 1,
  interactive = false,
  pauseWhenHidden = true,
  seed = 1,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: WorkflowTopologyFieldProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-wtf-${uid}`;
  const bgRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  const staticMode = reducedMotion === true;
  const onScreen = useVisibilityPause(bgRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;

  // Live field size. Server + first client render assume a desktop-shaped field
  // (so hydration matches); a ResizeObserver flips it to the measured container
  // after mount. Nothing derived from the size reaches the SSR markup.
  const [size, setSize] = React.useState<Size>({ w: W, h: H });
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cw = Math.round(e.contentRect.width);
        const ch = Math.round(e.contentRect.height);
        if (cw > 0 && ch > 0) setSize((p) => (p.w === cw && p.h === ch ? p : { w: cw, h: ch }));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Composition: a strict content-placement preset. The topology runs full-bleed
  // and a frosted-glass scrim behind the copy keeps it readable — no CSS mask, no
  // hard edge. Legacy `safeArea` (no placement) keeps the gentle elliptical
  // thinning for backward compatibility.
  const comp = React.useMemo(
    () => resolveComposition({ contentPlacement, safeArea, safeAreaPadding, safeAreaStrength }),
    [contentPlacement, safeArea, safeAreaPadding, safeAreaStrength],
  );
  const scrimStyle = comp.hasSafe ? compositionScrimStyle(comp) : undefined;
  const legacySafe = React.useMemo(
    () => safeArea ?? { x: 0.04, y: 0.14, w: 0.5, h: 0.72 },
    [safeArea],
  );

  const box = React.useMemo(() => mapBox(comp.placement), [comp.placement]);

  const model = React.useMemo(() => {
    const src = nodes && nodes.length ? { nodes, connections: connections ?? [] } : defaultTopology();
    const placed = place(src.nodes);
    const activeN = new Set(activeNodeIds ?? []);
    const activeC = new Set(activeConnectionIds ?? []);

    // Project the full-bleed topology to field pixels (nodes span the whole frame,
    // every placement). Right-content mirrors the flow so it points away from the
    // copy, but the nodes still cover the full width.
    const mirror = comp.placement === "right";
    placed.forEach((p) => {
      const fx = box.x + (mirror ? 1 - p.nx : p.nx) * box.w;
      const fy = box.y + p.ny * box.h;
      p.fx = fx;
      p.fy = fy;
      p.px = round1(fx * size.w);
      p.py = round1(fy * size.h);
    });

    // Apply active overrides without clobbering an explicit failed/completed status.
    placed.forEach((p) => {
      if (activeN.has(p.id) && p.status !== "failed" && p.status !== "completed") p.status = "active";
    });

    // No node is dropped behind the copy — the field runs full-bleed and the
    // frosted scrim keeps the copy readable, so nodes over it linger as soft
    // glowing tokens (their labels are still suppressed near the copy).
    const edges: PlacedEdge[] = [];
    (src.connections ?? []).forEach((c, i) => {
      const a = placed.get(c.from);
      const b = placed.get(c.to);
      if (!a || !b) return;
      const eid = c.id ?? `${c.from}>${c.to}`;
      const { d, len } = edgePath(a, b);
      const failed = a.status === "failed" || b.status === "failed";
      const settled = a.status === "completed" && b.status === "completed";
      // Active when explicitly listed, or when it feeds/leaves an active node.
      const touchesActive = a.status === "active" || b.status === "active";
      const active =
        !failed && (activeC.has(eid) || activeC.has(`${c.from}>${c.to}`) || (activeC.size === 0 && touchesActive));
      // Midpoint (0–1) for the content softening pass.
      edges.push({ id: `${eid}-${i}`, d, len, active, settled, failed, mx: (a.fx + b.fx) / 2, my: (a.fy + b.fy) / 2 });
    });

    return { placed: [...placed.values()], edges };
  }, [nodes, connections, activeNodeIds, activeConnectionIds, comp, box, size.w, size.h]);

  const lattice = React.useMemo(
    () => (staticMode || depth <= 0 ? [] : buildLattice(seed, depth, density, comp.hasSafe ? comp.safe : legacySafe)),
    [seed, depth, density, comp, legacySafe, staticMode],
  );

  // Ambient motes fill the whole field so no quadrant reads as dead space; the
  // content falloff quiets them behind the copy like everything else.
  const falloff = React.useMemo(() => contentFalloff(comp), [comp]);
  // Background layers (motes, lattice, edges) keep a high floor behind the copy —
  // the field stays visible everywhere and readability comes from the frosted
  // scrim's blur, not from fading the field to nothing. Mirrors the reference
  // canvas's `softDim`. No-op (returns 1) when there is no safe area.
  const softField = React.useCallback(
    (x: number, y: number) => (comp.hasSafe ? 0.66 + 0.34 * falloff(x, y) : 1),
    [comp.hasSafe, falloff],
  );
  const motes = React.useMemo(() => buildMotes(seed, density), [seed, density]);

  // Pointer highlight — writes CSS vars only (no per-frame React re-render).
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || !interactive || staticMode) return;
    let raf = 0;
    let nx = size.w / 2;
    let ny = size.h / 2;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--wtf-cx", String(round1(nx)));
      el.style.setProperty("--wtf-cy", String(round1(ny)));
      el.style.setProperty("--wtf-cursor", "1");
    };
    const onMove = (e: PointerEvent) => {
      if (systemReduced) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      nx = ((e.clientX - r.left) / r.width) * size.w;
      ny = ((e.clientY - r.top) / r.height) * size.h;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => el.style.setProperty("--wtf-cursor", "0");
    const host = el.parentElement ?? el;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode, systemReduced, size.w, size.h]);

  const vw = size.w;
  const vh = size.h;
  const sa = {
    cx: (legacySafe.x + legacySafe.w / 2) * vw,
    cy: (legacySafe.y + legacySafe.h / 2) * vh,
    rx: (legacySafe.w / 2) * vw * 1.16,
    ry: (legacySafe.h / 2) * vh * 1.16,
  };
  const showLabel = (n: PlacedNode) =>
    showLabels &&
    !(hideLabelsNearContent && comp.hasSafe && labelHiddenAt(comp, n.fx, n.fy));

  const flowDur = speed > 0 && !staticMode ? round1(clamp(3.4 / speed, 0.8, 12)) : 0;

  // Node scale — bigger, confident tokens (extra bump on narrow layouts so the
  // mobile band reads as a premium filled hero, not a thin outline diagram).
  const narrow = vw < 640;
  const s = narrow ? clamp(vw / 430, 1.04, 1.5) : clamp(vw / 760, 1, 1.6);
  const g = (v: number) => round1(v * s);

  const glow = clamp(intensity, 0, 1.4);
  const dim = `color-mix(in oklab, var(--color-fg) ${round1(clamp(20 * intensity, 8, 34))}%, transparent)`;
  const azure = "var(--color-accent)";
  const cyan = "var(--color-secondary-accent, var(--color-info))";
  const errCol = "var(--color-error)";
  const okCol = "var(--color-success)";
  const warnCol = "var(--color-warning)";

  // Baked stage lighting geometry (userSpace px). A cool spotlight sits over the
  // topology's focal side; a floor lift + corner vignette add depth — so the
  // component reads as a lit premium stage on its own, not only inside a docs
  // stage. Token-driven → correct in light and dark.
  const mirrorLight = comp.placement === "right";
  const focalX = round1((box.x + (mirrorLight ? 1 - 0.62 : 0.62) * box.w) * vw);
  const focalY = round1((box.y + 0.5 * box.h) * vh * 0.92);
  const lightR = round1(Math.hypot(vw, vh) * 0.62);
  const vigR = round1(Math.hypot(vw, vh) * 0.72);

  const css = `
.${cls} { position: absolute; inset: 0; }
.${cls} svg { width: 100%; height: 100%; display: block; }
.${cls} .mk-wtf-edge { fill: none; vector-effect: non-scaling-stroke; }
.${cls} .mk-wtf-flow {
  fill: none; vector-effect: non-scaling-stroke;
  stroke-dasharray: 3 14;
}
.${cls}.mk-wtf-animated .mk-wtf-flow {
  animation: ${cls}-flow var(--fd, 3.4s) linear infinite;
}
.${cls}.mk-wtf-animated .mk-wtf-active-node {
  animation: ${cls}-pulse 2.6s ease-in-out infinite;
  transform-box: fill-box; transform-origin: center;
}
.${cls}.mk-wtf-animated .mk-wtf-lattice {
  animation: ${cls}-drift var(--dur, 22s) ease-in-out infinite alternate;
  will-change: transform;
}
.${cls} .mk-wtf-mote { opacity: var(--o, 0.2); }
.${cls}.mk-wtf-animated .mk-wtf-mote {
  animation: ${cls}-twinkle var(--md, 5s) ease-in-out var(--mdl, 0s) infinite;
}
@keyframes ${cls}-flow { to { stroke-dashoffset: -17; } }
@keyframes ${cls}-pulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.14); }
}
@keyframes ${cls}-drift {
  from { transform: translate3d(0,0,0); }
  to { transform: translate3d(var(--dx,0px), var(--dy,0px), 0); }
}
@keyframes ${cls}-twinkle {
  0%, 100% { opacity: calc(var(--o, 0.2) * 0.4); }
  50% { opacity: var(--o, 0.2); }
}
.${cls}[data-paused="true"] .mk-wtf-flow,
.${cls}[data-paused="true"] .mk-wtf-active-node,
.${cls}[data-paused="true"] .mk-wtf-mote,
.${cls}[data-paused="true"] .mk-wtf-lattice { animation-play-state: paused !important; }
${interactive ? `.${cls} .mk-wtf-cursor {
  transform: translate(calc(var(--wtf-cx,600) * 1px), calc(var(--wtf-cy,380) * 1px));
  opacity: calc(var(--wtf-cursor,0) * 0.5);
}` : ""}
@media (max-width: 640px) {
  .${cls} .mk-wtf-lattice[data-i="${clamp(Math.round(depth), 0, 3) - 1}"] { display: none; }
  .${cls} .mk-wtf-label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .${cls} .mk-wtf-flow, .${cls} .mk-wtf-active-node, .${cls} .mk-wtf-lattice, .${cls} .mk-wtf-mote { animation: none !important; }
}
/* Forced-colors: drop gradients/masks/filters and fall back to plain CanvasText
   strokes so structure + status stay legible. */
@media (forced-colors: active) {
  .${cls} .mk-wtf-wash, .${cls} .mk-wtf-light, .${cls} .mk-wtf-mote, .${cls} .mk-wtf-glow, .${cls} .mk-wtf-cursor, .${cls} .mk-wtf-flow { display: none; }
  .${cls} svg { forced-color-adjust: none; }
  .${cls} .mk-wtf-edge { stroke: CanvasText !important; stroke-opacity: 0.6 !important; }
  .${cls} .mk-wtf-node-fill { fill: Canvas !important; stroke: CanvasText !important; }
  .${cls} .mk-wtf-glyph { stroke: CanvasText !important; }
}`.trim();

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style} {...props}>
      <div
        ref={bgRef}
        aria-hidden="true"
        data-paused={paused ? "true" : "false"}
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden",
          cls,
          !staticMode && "mk-wtf-animated",
        )}
      >
        {/* Full-bleed field — no mask; the topology runs edge-to-edge so the flow
            is visible on every side, including center placement. */}
        <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" role="presentation">
          <defs>
            {/* Focal spotlight over the topology side (accent → cyan → clear). */}
            <radialGradient id={`spot-${uid}`} gradientUnits="userSpaceOnUse" cx={focalX} cy={focalY} r={lightR}>
              <stop offset="0%" stopColor={azure} stopOpacity={round1(0.2 * glow)} />
              <stop offset="42%" stopColor={cyan} stopOpacity={round1(0.07 * glow)} />
              <stop offset="100%" stopColor={azure} stopOpacity="0" />
            </radialGradient>
            {/* Soft floor lift so the field never bottoms out to a flat void. */}
            <linearGradient id={`floor-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={vh} x2={0} y2={round1(vh * 0.35)}>
              <stop offset="0%" stopColor={azure} stopOpacity={round1(0.06 * glow)} />
              <stop offset="100%" stopColor={azure} stopOpacity="0" />
            </linearGradient>
            {/* Corner vignette for depth — frames the lit stage in both themes. */}
            <radialGradient id={`vig-${uid}`} gradientUnits="userSpaceOnUse" cx={round1(vw / 2)} cy={round1(vh / 2)} r={vigR}>
              <stop offset="0%" stopColor="var(--color-bg)" stopOpacity="0" />
              <stop offset="46%" stopColor="var(--color-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0.55" />
            </radialGradient>
            {/* Health-tinted node under-glows (reused across nodes). */}
            {[["accent", azure], ["ok", okCol], ["err", errCol], ["warn", warnCol], ["idle", cyan]].map(([k, col]) => (
              <radialGradient key={k} id={`glow-${k}-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={col} stopOpacity="0.9" />
                <stop offset="100%" stopColor={col} stopOpacity="0" />
              </radialGradient>
            ))}
            <radialGradient id={`safegrad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(18,18,18)" />
              <stop offset="60%" stopColor="rgb(120,120,120)" />
              <stop offset="100%" stopColor="#fff" />
            </radialGradient>
            <mask id={`safe-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={vw} height={vh}>
              <rect x="0" y="0" width={vw} height={vh} fill="#fff" />
              <ellipse cx={round1(sa.cx)} cy={round1(sa.cy)} rx={round1(sa.rx)} ry={round1(sa.ry)} fill={`url(#safegrad-${uid})`} />
            </mask>
          </defs>

          {/* Baked stage lighting — read as a lit premium surface everywhere. */}
          <rect className="mk-wtf-light mk-wtf-wash" x="0" y="0" width={vw} height={vh} fill={`url(#spot-${uid})`} />
          <rect className="mk-wtf-light" x="0" y="0" width={vw} height={vh} fill={`url(#floor-${uid})`} />
          <rect className="mk-wtf-light" x="0" y="0" width={vw} height={vh} fill={`url(#vig-${uid})`} />

          {/* Ambient signal motes — fill the whole field so no quadrant reads dead. */}
          <g>
            {motes.map((m, i) => {
              const fx = m.x;
              const fy = m.y;
              // Softened (not deleted) behind the copy so the field stays alive on
              // every side; the frosted scrim blurs the motes under the text.
              const o = round1(clamp(m.o * intensity * softField(fx, fy), 0, 0.6));
              if (o < 0.02) return null;
              return (
                <circle
                  key={i}
                  className="mk-wtf-mote"
                  cx={round1(fx * vw)}
                  cy={round1(fy * vh)}
                  r={round1(m.r * (narrow ? 1.15 : 1))}
                  fill={m.warm ? azure : cyan}
                  style={{ "--o": o, "--md": `${m.dur}s`, "--mdl": `${m.delay}s` } as React.CSSProperties}
                />
              );
            })}
          </g>

          <g mask={comp.hasSafe ? undefined : `url(#safe-${uid})`}>
            {/* Atmospheric parallax lattice (behind the topology). */}
            {lattice.map((layer, li) => (
              <g
                key={li}
                className="mk-wtf-lattice"
                data-i={li}
                style={{ "--dx": `${layer.dx}px`, "--dy": `${layer.dy}px`, "--dur": `${layer.dur}s` } as React.CSSProperties}
              >
                {layer.dots.map((d, i) => (
                  <circle key={i} cx={round1(d.x * vw)} cy={round1(d.y * vh)} r={g(d.r)} fill={dim} fillOpacity={round1(d.o * softField(d.x, d.y))} />
                ))}
              </g>
            ))}

            {/* Connections: settled (completed) · failed · idle · active-flow. */}
            <g style={{ "--fd": `${flowDur}s` } as React.CSSProperties}>
              {model.edges.map((e) => {
                const stroke = e.failed
                  ? errCol
                  : e.settled
                    ? cyan
                    : dim;
                // Edges run full-bleed; behind the copy they soften (high floor) so
                // the network stays visible under the frosted scrim, never masked out.
                const sd = softField(e.mx, e.my);
                const baseOpacity = round1((e.failed ? 0.46 : e.settled ? 0.42 * intensity : e.active ? 0.4 * intensity : 0.3 * intensity) * sd);
                return (
                  <g key={e.id}>
                    <path
                      className="mk-wtf-edge"
                      d={e.d}
                      stroke={stroke}
                      strokeOpacity={baseOpacity}
                      strokeWidth={e.active ? 1.8 : 1.2}
                      strokeLinecap="round"
                      strokeDasharray={e.failed ? "5 6" : undefined}
                    />
                    {e.active && flowDur > 0 ? (
                      <path
                        className="mk-wtf-flow"
                        d={e.d}
                        stroke={azure}
                        strokeOpacity={round1(clamp(0.9 * intensity * sd, 0.4, 1))}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                      />
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* Nodes + non-color status glyphs. */}
            {model.placed.map((n) => {
              const isFailed = n.status === "failed";
              const isActive = n.status === "active";
              const isDone = n.status === "completed";
              const ring = isFailed ? errCol : isActive ? azure : isDone ? okCol : "var(--color-border-strong, var(--color-border))";
              const r = g(isActive ? 11 : isFailed ? 9.5 : 8.5);
              const glowKey = isFailed ? "err" : isActive ? "accent" : isDone ? "ok" : "idle";
              // Full-bleed: nodes over the copy are not dropped — they soften into
              // soft glowing tokens (the scrim blurs them). `raw` fades to ~0.08
              // behind the copy; `ndim` keeps the token body faintly visible while a
              // floored under-glow keeps it reading as a lit network node.
              const raw = falloff(n.fx, n.fy);
              const ndim = round1(clamp(0.34 + 0.66 * raw, 0, 1));
              const glowDim = clamp(0.55 + 0.45 * raw, 0, 1);
              const glowO = round1(clamp((isActive ? 0.4 : isFailed ? 0.3 : 0.24) * glow * glowDim, 0, 0.7));
              return (
                <g key={n.id}>
                  {/* Health-tinted under-glow so each node reads as a lit token —
                      floored so it survives behind the copy as a soft glow. */}
                  <circle className="mk-wtf-glow" cx={n.px} cy={n.py} r={round1(r * 2.5)} fill={`url(#glow-${glowKey}-${uid})`} opacity={glowO} />
                  <g opacity={ndim}>
                    {isActive ? (
                      <circle className="mk-wtf-active-node" cx={n.px} cy={n.py} r={round1(r + g(6))} fill="none" stroke={azure} strokeOpacity={round1(0.5 * intensity)} strokeWidth={1.5} />
                    ) : null}
                    <circle
                      className="mk-wtf-node-fill"
                      cx={n.px}
                      cy={n.py}
                      r={r}
                      fill="var(--color-surface)"
                      stroke={ring}
                      strokeWidth={isActive || isFailed ? 2 : 1.5}
                      strokeOpacity={round1(clamp(0.95 * intensity, 0.4, 1))}
                    />
                    {/* Status glyph — legible without color. */}
                    {isDone ? (
                      <path className="mk-wtf-glyph" d={`M ${round1(n.px - g(3))} ${n.py} l ${g(2)} ${g(2.4)} l ${g(4)} ${g(-5)}`} fill="none" stroke={okCol} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    ) : isFailed ? (
                      <path className="mk-wtf-glyph" d={`M ${round1(n.px - g(2.6))} ${round1(n.py - g(2.6))} l ${g(5.2)} ${g(5.2)} M ${round1(n.px + g(2.6))} ${round1(n.py - g(2.6))} l ${g(-5.2)} ${g(5.2)}`} fill="none" stroke={errCol} strokeWidth={1.7} strokeLinecap="round" />
                    ) : isActive ? (
                      <circle className="mk-wtf-glyph" cx={n.px} cy={n.py} r={g(2.4)} fill={azure} />
                    ) : (
                      <circle className="mk-wtf-glyph" cx={n.px} cy={n.py} r={g(2.4)} fill="none" stroke="var(--color-muted)" strokeWidth={1.2} />
                    )}
                    {n.label && showLabel(n) ? (
                      <text className="mk-wtf-label" x={round1(n.px + r + g(6))} y={round1(n.py + g(3.5))} fontSize={g(12)} fill="var(--color-muted)" style={{ fontFamily: "inherit" }}>
                        {n.label}
                      </text>
                    ) : null}
                  </g>
                </g>
              );
            })}

            {interactive ? (
              <circle className="mk-wtf-cursor" cx={0} cy={0} r={70} fill={azure} fillOpacity={0.16} />
            ) : null}
          </g>
        </svg>

        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {children != null ? (
        <>
          {/* Glass scrim behind the copy: a soft wash + feathered backdrop blur so
              the text stays readable while the topology continues underneath — no
              hard cut, and the field stays visible through the frosted panel. */}
          {scrimStyle ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={scrimStyle} />
          ) : null}
          <div className="relative z-10">{children}</div>
        </>
      ) : null}
    </div>
  );
}

export default WorkflowTopologyField;
