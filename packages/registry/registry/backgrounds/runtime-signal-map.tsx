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

export type ServiceHealth = "healthy" | "degraded" | "error";
export type ServiceIcon =
  | "edge"
  | "gateway"
  | "compute"
  | "payments"
  | "database"
  | "cache"
  | "auth"
  | "queue";

export interface ServiceData {
  /** Stable id referenced by connections. */
  id: string;
  /** 0–1 horizontal position inside the map area. */
  x: number;
  /** 0–1 vertical position inside the map area. */
  y: number;
  /** Health — drives the status glyph, dash treatment, and flow (never color alone). */
  health?: ServiceHealth;
  /** Region id this service belongs to (shared column tint + header). */
  region?: string;
  /** Short label rendered on the node card. */
  label?: string;
  /** One short status line under the label (e.g. "18k rpm", "unreachable"). */
  status?: string;
  /** Glyph drawn on the node card. */
  icon?: ServiceIcon;
  /**
   * Emphasis. "primary" nodes render as full cards and always show on mobile;
   * "secondary" nodes are lighter and drop out on the narrowest layouts.
   */
  tier?: "primary" | "secondary";
}

export interface RegionData {
  /** Stable id referenced by `ServiceData.region`. */
  id: string;
  /** Region header rendered above the column (e.g. "EDGE", "API"). */
  label?: string;
}

export type SignalDirection = "forward" | "reverse" | "bidirectional";
export type LatencyBand = "low" | "medium" | "high";

export interface ConnectionData {
  /** Source service id. */
  from: string;
  /** Target service id. */
  to: string;
  /** Packet travel direction along the edge. Default "forward" (from → to). */
  direction?: SignalDirection;
  /** Latency band — scales packet speed (low = brisk, high = sluggish). */
  latencyBand?: LatencyBand;
  /** Per-edge request-rate multiplier (~0–2). */
  activity?: number;
}

export interface SignalRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface RuntimeSignalMapProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Application-defined services. Omit to render a deterministic fictional topology. */
  services?: ServiceData[];
  /** Application-defined regions (column headers). */
  regions?: RegionData[];
  /** Directed connections between services. */
  connections?: ConnectionData[];
  /** Global request-rate multiplier — scales ambient traffic across edges (~0–2). */
  activity?: number;
  /**
   * Where the foreground content sits. Sets a strict readable region: fades the
   * map behind the copy (CSS mask), moves the topology onto the open side, and
   * drops any label near the copy — the one prop for a readable hero. "none" =
   * a centered full-bleed map.
   */
  contentPlacement?: ContentPlacement;
  /** Extra ramp width (0–1) over which the map fades back in past the content. */
  safeAreaPadding?: number;
  /** How strongly the map is suppressed behind content (0–1). */
  safeAreaStrength?: number;
  /** Show service labels/status. Default true (auto-hidden near content). */
  showLabels?: boolean;
  /** Hide labels that fall inside/near the readable region. Default true. */
  hideLabelsNearContent?: boolean;
  /** Region where signals thin so foreground text stays readable (0–1 coords). */
  safeArea?: SignalRect;
  /** Ambient-traffic density multiplier (~0.4–1.6). */
  density?: number;
  /** Overall luminance/opacity of the map (0–1.4). */
  intensity?: number;
  /** Flow speed multiplier. 0 stalls flow (topology still legible). */
  speed?: number;
  /** Pointer highlights the nearest service + its edges (never the sole effect). */
  interactive?: boolean;
  /** Pause flow when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Deterministic seed for edge-bow layout (SSR-stable). */
  seed?: number;
  /** Force the static, motion-free snapshot regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic model                                                        */
/* -------------------------------------------------------------------------- */

/** mulberry32 — no Math.random / Date.now at render or module scope (SSR-stable). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

/**
 * A clearly-FICTIONAL preview topology — not real telemetry. One deliberate flow
 * (edge → API → services → data) across six services: a healthy request path that
 * reaches the database, one degraded cache route, and one failed payments route.
 */
export function demoTopology(): {
  services: ServiceData[];
  regions: RegionData[];
  connections: ConnectionData[];
} {
  const services: ServiceData[] = [
    { id: "cdn", x: 0.05, y: 0.26, region: "edge", health: "healthy", label: "CDN", status: "edge cache", icon: "edge", tier: "secondary" },
    { id: "edge", x: 0.05, y: 0.64, region: "edge", health: "healthy", label: "Edge", status: "ingress", icon: "edge", tier: "secondary" },
    { id: "gateway", x: 0.23, y: 0.44, region: "api", health: "healthy", label: "API Gateway", status: "18k rpm", icon: "gateway", tier: "secondary" },
    { id: "auth", x: 0.23, y: 0.78, region: "api", health: "healthy", label: "Auth", status: "verified", icon: "auth", tier: "secondary" },
    { id: "sessions", x: 0.4, y: 0.6, region: "api", health: "healthy", label: "Sessions", status: "24k live", icon: "auth", tier: "secondary" },
    { id: "workers", x: 0.62, y: 0.22, region: "services", health: "healthy", label: "Workers", status: "3 healthy", icon: "compute", tier: "primary" },
    { id: "queue", x: 0.62, y: 0.5, region: "services", health: "degraded", label: "Queue", status: "backlog 1.2k", icon: "queue", tier: "secondary" },
    { id: "payments", x: 0.62, y: 0.82, region: "services", health: "error", label: "Payments", status: "unreachable", icon: "payments", tier: "primary" },
    { id: "cache", x: 0.79, y: 0.37, region: "data", health: "healthy", label: "Cache", status: "warm", icon: "cache", tier: "secondary" },
    { id: "database", x: 0.94, y: 0.22, region: "data", health: "healthy", label: "Database", status: "writes ok", icon: "database", tier: "primary" },
    { id: "replica", x: 0.94, y: 0.5, region: "data", health: "healthy", label: "Replica", status: "in sync", icon: "database", tier: "secondary" },
    { id: "warehouse", x: 0.94, y: 0.78, region: "data", health: "healthy", label: "Warehouse", status: "synced", icon: "database", tier: "secondary" },
  ];
  const regions: RegionData[] = [
    { id: "edge", label: "Edge" },
    { id: "api", label: "API" },
    { id: "services", label: "Services" },
    { id: "data", label: "Data" },
  ];
  const connections: ConnectionData[] = [
    { from: "cdn", to: "gateway", latencyBand: "low", activity: 1.1 },
    { from: "edge", to: "gateway", latencyBand: "low", activity: 1.3 },
    { from: "edge", to: "auth", latencyBand: "medium" },
    { from: "gateway", to: "workers", latencyBand: "low", activity: 1.2 },
    { from: "gateway", to: "payments", latencyBand: "medium" },
    { from: "auth", to: "sessions", latencyBand: "low" },
    { from: "sessions", to: "queue", latencyBand: "high" },
    { from: "workers", to: "cache", latencyBand: "low" },
    { from: "workers", to: "database", latencyBand: "low", activity: 1.2 },
    { from: "queue", to: "warehouse", latencyBand: "high" },
    { from: "cache", to: "database", direction: "bidirectional", latencyBand: "medium" },
    { from: "database", to: "replica", latencyBand: "low" },
    { from: "database", to: "warehouse", latencyBand: "low" },
  ];
  return { services, regions, connections };
}

type EdgeRole = "active" | "healthy" | "degraded" | "failed";

interface EdgeModel {
  fromId: string;
  toId: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  health: ServiceHealth;
  role: EdgeRole;
  direction: SignalDirection;
  /** Steady ambient rate — latency band × per-edge activity. */
  rate: number;
  /** Deterministic phase so ambient dots don't march in lockstep. */
  phase: number;
}

interface NodeModel {
  x: number;
  y: number;
  health: ServiceHealth;
  region?: string;
  label?: string;
  status?: string;
  icon?: ServiceIcon;
  tier: "primary" | "secondary";
  /** On the active request path — always shown, even on the narrowest layout. */
  essential: boolean;
}

interface RegionModel {
  id: string;
  label?: string;
  /** Column centre + span in 0–1 map coords, auto-fit to member nodes. */
  cx: number;
  x0: number;
  x1: number;
}

interface SignalModel {
  nodes: Map<string, NodeModel>;
  order: string[];
  edges: EdgeModel[];
  regions: RegionModel[];
  /** Ordered node ids of the current active request path (healthy, longest). */
  activePath: string[];
}

const HEALTH_RANK: Record<ServiceHealth, number> = { healthy: 0, degraded: 1, error: 2 };
const worstHealth = (a: ServiceHealth, b: ServiceHealth): ServiceHealth =>
  HEALTH_RANK[a] >= HEALTH_RANK[b] ? a : b;

const LATENCY_RATE: Record<LatencyBand, number> = { low: 1.2, medium: 0.85, high: 0.55 };

/** Longest all-healthy forward path from an ingress node — the "current request". */
function deriveActivePath(nodes: Map<string, NodeModel>, edges: EdgeModel[]): string[] {
  const out = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const list = out.get(from);
    if (list) list.push(to);
    else out.set(from, [to]);
  };
  const incoming = new Set<string>();
  edges.forEach((e) => {
    if (worstHealth(nodes.get(e.fromId)?.health ?? "healthy", nodes.get(e.toId)?.health ?? "healthy") !== "healthy") return;
    if (e.direction !== "reverse") { link(e.fromId, e.toId); incoming.add(e.toId); }
    if (e.direction === "reverse" || e.direction === "bidirectional") { link(e.toId, e.fromId); incoming.add(e.fromId); }
  });
  let best: string[] = [];
  const walk = (id: string, seen: Set<string>, path: string[]) => {
    if (path.length > best.length) best = path.slice();
    for (const next of out.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      path.push(next);
      walk(next, seen, path);
      path.pop();
      seen.delete(next);
    }
  };
  nodes.forEach((n, id) => {
    if (n.health !== "healthy") return;
    if (incoming.has(id)) return; // start only at ingress nodes
    walk(id, new Set([id]), [id]);
  });
  return best.length >= 2 ? best : [];
}

function buildModel(
  services: ServiceData[],
  connections: ConnectionData[],
  regions: RegionData[],
  seed: number,
): SignalModel {
  const rng = makeRng((seed >>> 0) * 0x9e3779b1 + 0x85);
  const nodes = new Map<string, NodeModel>();
  services.forEach((s) => {
    nodes.set(s.id, {
      x: clamp(s.x, 0, 1),
      y: clamp(s.y, 0, 1),
      health: s.health ?? "healthy",
      region: s.region,
      label: s.label,
      status: s.status,
      icon: s.icon,
      tier: s.tier ?? "primary",
      essential: false,
    });
  });
  const order = services.map((s) => s.id);

  const rawEdges: EdgeModel[] = [];
  connections.forEach((c) => {
    const a = nodes.get(c.from);
    const b = nodes.get(c.to);
    if (!a || !b) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Gentle perpendicular bow so the flow reads as a curve, not a wire.
    const bow = (0.06 + rng() * 0.04) * len * (dy >= 0 ? 1 : -1);
    const px = -dy / len;
    const py = dx / len;
    const health = worstHealth(a.health, b.health);
    const band = c.latencyBand ?? "medium";
    rawEdges.push({
      fromId: c.from,
      toId: c.to,
      ax: a.x, ay: a.y, bx: b.x, by: b.y,
      c1x: a.x + dx * 0.4 + px * bow,
      c1y: a.y + dy * 0.4 + py * bow,
      c2x: a.x + dx * 0.6 + px * bow,
      c2y: a.y + dy * 0.6 + py * bow,
      health,
      role: health === "error" ? "failed" : health === "degraded" ? "degraded" : "healthy",
      direction: c.direction ?? "forward",
      rate: LATENCY_RATE[band] * clamp(c.activity ?? 1, 0, 2),
      phase: rng(),
    });
  });

  const activePath = deriveActivePath(nodes, rawEdges);
  const activeSet = new Set(activePath);
  activePath.forEach((id) => {
    const n = nodes.get(id);
    if (n) n.essential = true;
  });
  const activeEdge = new Set<string>();
  for (let i = 0; i < activePath.length - 1; i++) activeEdge.add(`${activePath[i]}|${activePath[i + 1]}`);
  rawEdges.forEach((e) => {
    if (e.role === "healthy" && (activeEdge.has(`${e.fromId}|${e.toId}`) || activeEdge.has(`${e.toId}|${e.fromId}`))) {
      e.role = "active";
    }
  });
  // Keep the failed/degraded routes drawn even if they touch an active node.
  void activeSet;

  // Region columns — auto-fit horizontally to member nodes for the header + tint.
  const regionModels: RegionModel[] = [];
  regions.forEach((r) => {
    const members = services.filter((s) => s.region === r.id);
    if (!members.length) return;
    let x0 = 1;
    let x1 = 0;
    members.forEach((s) => {
      x0 = Math.min(x0, s.x);
      x1 = Math.max(x1, s.x);
    });
    regionModels.push({ id: r.id, label: r.label, cx: (x0 + x1) / 2, x0, x1 });
  });

  return { nodes, order, edges: rawEdges, regions: regionModels, activePath };
}

/* -------------------------------------------------------------------------- */
/* Canvas colors                                                              */
/* -------------------------------------------------------------------------- */

interface Palette {
  accent: string; // azure — active request traffic
  cyan: string; // supporting signals
  success: string; // healthy
  warning: string; // degraded
  error: string; // failed
  fg: string;
  muted: string;
  border: string;
  surface: string;
  bg: string;
}

const FALLBACK: Palette = {
  accent: "#4f7cff", cyan: "#22c7d9", success: "#32d583", warning: "#f6b94a", error: "#ff5c70",
  fg: "#f8fafc", muted: "#9caabd", border: "#263449", surface: "#111827", bg: "#0b111d",
};

/** Read semantic tokens off the mounted element. Never called during render. */
function resolvePalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const read = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    accent: read("--color-accent", FALLBACK.accent),
    cyan: read("--color-secondary-accent", FALLBACK.cyan),
    success: read("--color-success", FALLBACK.success),
    warning: read("--color-warning", FALLBACK.warning),
    error: read("--color-error", FALLBACK.error),
    fg: read("--color-fg", FALLBACK.fg),
    muted: read("--color-muted", FALLBACK.muted),
    border: read("--color-border", FALLBACK.border),
    surface: read("--color-surface", FALLBACK.surface),
    bg: read("--color-bg-elevated", read("--color-surface", FALLBACK.bg)),
  };
}

const roleColor = (p: Palette, role: EdgeRole) =>
  role === "active" ? p.accent : role === "failed" ? p.error : role === "degraded" ? p.warning : p.cyan;

const healthColor = (p: Palette, h: ServiceHealth) =>
  h === "error" ? p.error : h === "degraded" ? p.warning : p.success;

const TAU = Math.PI * 2;

/** Add an alpha channel to a resolved token color (hex or rgb/rgba) for gradients. */
function withAlpha(color: string, a: number): string {
  const v = Math.max(0, Math.min(1, a));
  const c = color.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((d) => d + d).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${v})`;
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3);
    if (parts.length === 3) return `rgba(${parts.join(", ")}, ${v})`;
  }
  return c;
}

/** Cubic-bezier point at t (0–1 map space). */
function bezier(e: EdgeModel, t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * e.ax + b * e.c1x + c * e.c2x + d * e.bx, a * e.ay + b * e.c1y + c * e.c2y + d * e.by];
}

/* -------------------------------------------------------------------------- */
/* Node glyphs (canvas paths — stroke-based, centred at 0,0)                   */
/* -------------------------------------------------------------------------- */

function drawIcon(ctx: CanvasRenderingContext2D, icon: ServiceIcon | undefined, s: number) {
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  switch (icon) {
    case "edge":
      ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.62, 0); ctx.lineTo(s * 0.62, 0);
      ctx.moveTo(0, -s * 0.62); ctx.bezierCurveTo(s * 0.42, -s * 0.2, s * 0.42, s * 0.2, 0, s * 0.62);
      ctx.bezierCurveTo(-s * 0.42, s * 0.2, -s * 0.42, -s * 0.2, 0, -s * 0.62);
      break;
    case "gateway":
      ctx.moveTo(-s * 0.1, -s * 0.6); ctx.lineTo(-s * 0.55, 0); ctx.lineTo(-s * 0.1, s * 0.6);
      ctx.moveTo(s * 0.1, -s * 0.6); ctx.lineTo(s * 0.55, 0); ctx.lineTo(s * 0.1, s * 0.6);
      break;
    case "compute": {
      const r = s * 0.5;
      ctx.roundRect(-r, -r, r * 2, r * 2, s * 0.16);
      for (const d of [-0.28, 0.28]) {
        ctx.moveTo(d * s, -r); ctx.lineTo(d * s, -r - s * 0.22);
        ctx.moveTo(d * s, r); ctx.lineTo(d * s, r + s * 0.22);
        ctx.moveTo(-r, d * s); ctx.lineTo(-r - s * 0.22, d * s);
        ctx.moveTo(r, d * s); ctx.lineTo(r + s * 0.22, d * s);
      }
      break;
    }
    case "payments":
      ctx.roundRect(-s * 0.62, -s * 0.44, s * 1.24, s * 0.88, s * 0.14);
      ctx.moveTo(-s * 0.62, -s * 0.12); ctx.lineTo(s * 0.62, -s * 0.12);
      break;
    case "database":
      ctx.ellipse(0, -s * 0.42, s * 0.55, s * 0.2, 0, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.55, -s * 0.42); ctx.lineTo(-s * 0.55, s * 0.42);
      ctx.bezierCurveTo(-s * 0.55, s * 0.62, s * 0.55, s * 0.62, s * 0.55, s * 0.42);
      ctx.lineTo(s * 0.55, -s * 0.42);
      break;
    case "cache":
      ctx.moveTo(0, -s * 0.6); ctx.lineTo(s * 0.62, -s * 0.22); ctx.lineTo(0, s * 0.16); ctx.lineTo(-s * 0.62, -s * 0.22); ctx.closePath();
      ctx.moveTo(-s * 0.62, s * 0.18); ctx.lineTo(0, s * 0.56); ctx.lineTo(s * 0.62, s * 0.18);
      break;
    case "auth":
      ctx.moveTo(0, -s * 0.64); ctx.lineTo(s * 0.56, -s * 0.36); ctx.lineTo(s * 0.56, s * 0.12);
      ctx.quadraticCurveTo(s * 0.56, s * 0.56, 0, s * 0.66);
      ctx.quadraticCurveTo(-s * 0.56, s * 0.56, -s * 0.56, s * 0.12);
      ctx.lineTo(-s * 0.56, -s * 0.36); ctx.closePath();
      ctx.moveTo(-s * 0.26, s * 0.02); ctx.lineTo(-s * 0.05, s * 0.24); ctx.lineTo(s * 0.3, -s * 0.2);
      break;
    case "queue":
      for (const yy of [-0.5, -0.1, 0.3]) {
        ctx.moveTo(-s * 0.6, yy * s); ctx.lineTo(s * 0.6, yy * s);
      }
      ctx.moveTo(-s * 0.6, 0.62 * s); ctx.lineTo(s * 0.1, 0.62 * s);
      break;
    default:
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
  }
  ctx.stroke();
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * RuntimeSignalMap — an infrastructure background where a single request travels
 * a service topology (edge → API → services → data): it enters at ingress, flows
 * along curved edges, lights each service as it arrives, and reaches the database.
 * A degraded route slows; a failed route stops at a visible marker. Health is
 * carried by dash pattern + glyph + flow, never color alone. One `<canvas>` + one
 * requestAnimationFrame loop — no per-frame React state, no WebGL, and no
 * `Math.random`/`Date.now` at render, so server and client first paint match.
 * Decorative: renders `children` as foreground content. Clean-room original with
 * clearly-fictional default data — not real telemetry.
 */
export function RuntimeSignalMap({
  services,
  regions,
  connections,
  activity = 1,
  contentPlacement = "none",
  safeAreaPadding,
  safeAreaStrength,
  showLabels = true,
  hideLabelsNearContent = true,
  safeArea,
  density = 1,
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
}: RuntimeSignalMapProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-rsm-${uid}`;
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pointerRef = React.useRef<{ x: number; y: number; on: boolean }>({ x: 0.5, y: 0.5, on: false });

  const systemReduced = useReducedMotion();
  // The system preference isn't known at SSR, so ignore it until after mount —
  // server and first client render agree on data-motion (no hydration mismatch);
  // the static snapshot engages a frame later if reduced motion is on.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(wrapRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const model = React.useMemo(() => {
    const custom = services && services.length;
    const demo = custom ? null : demoTopology();
    const s = custom ? services : demo!.services;
    const c = connections && connections.length ? connections : custom ? [] : demo!.connections;
    const r = regions && regions.length ? regions : custom ? [] : demo!.regions;
    return buildModel(s, c, r, seed);
  }, [services, connections, regions, seed]);

  const comp = React.useMemo(
    () => resolveComposition({ contentPlacement, safeArea, safeAreaPadding, safeAreaStrength }),
    [contentPlacement, safeArea, safeAreaPadding, safeAreaStrength],
  );
  const scrimStyle = comp.hasSafe ? compositionScrimStyle(comp) : undefined;
  const falloff = React.useMemo(() => contentFalloff(comp), [comp]);

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const isDemo = !(services && services.length);
  const paramsRef = React.useRef({
    activity, density, intensity, speed, interactive, safeArea, comp, falloff, showLabels, hideLabelsNearContent, isDemo,
  });
  paramsRef.current = {
    activity, density, intensity, speed, interactive, safeArea, comp, falloff, showLabels, hideLabelsNearContent, isDemo,
  };

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !interactive || staticMode) return;
    const host = el;
    const onMove = (ev: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointerRef.current = { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height, on: true };
    };
    const onLeave = () => { pointerRef.current.on = false; };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const measure = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      width = wrap.clientWidth || 1;
      height = wrap.clientHeight || 1;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();

    let palette = resolvePalette(wrap);
    let colorAge = 0;

    // Deterministic ambient signal motes that fill the whole field so no corner
    // reads as dead space (density falloff still quiets them behind the copy).
    const ambRng = makeRng((seed >>> 0) * 0x85ebca6b + 0x27d4eb2f);
    const ambient = Array.from({ length: 84 }, () => ({
      x: ambRng(),
      y: ambRng(),
      r: 0.5 + ambRng() * 1.4,
      ph: ambRng(),
      sp: 0.15 + ambRng() * 0.5,
      warm: ambRng() > 0.72,
    }));

    /* Where the topology sits inside the canvas (0–1). The graphic lives on the
       side OPPOSITE the content; when the layout stacks (top/bottom, or a narrow
       horizontal), it drops into a generous band below/above the copy that fills
       the frame — no dead space. */
    const mapBox = (placement: ContentPlacement, W: number) => {
      void W;
      // Only an explicit top/bottom placement stacks; left/right/center keep the
      // same full-bleed landscape at EVERY width (the hero scales, never collapses
      // to a band). Nodes over the copy render as soft glowing shapes behind the
      // glass scrim; lighting + motes are always full-bleed.
      const stacked = placement === "top" || placement === "bottom";
      // Phone hero: full-width copy at the top, the graphic full-bleed below +
      // faintly behind it (glass scrim keeps the copy readable).
      if (stacked) return { x: 0.03, y: 0.42, w: 0.94, h: 0.55, stacked: true };
      return { x: 0.04, y: 0.09, w: 0.93, h: 0.82, stacked: false };
    };

    const draw = (timeSec: number) => {
      const {
        activity: act, density: den, intensity: inten, speed: spd, interactive: inter, safeArea: safe,
        comp: comp0, falloff: fall, showLabels: labelsOn, hideLabelsNearContent: hideNear, isDemo: demo,
      } = paramsRef.current;
      if (colorAge <= 0) { palette = resolvePalette(wrap); colorAge = 30; }
      colorAge -= 1;

      ctx.clearRect(0, 0, width, height);
      const W = width;
      const H = height;
      const glow = clamp(inten, 0, 1.4);
      const box = mapBox(comp0.placement, W);
      // Cards + region headers + metric chips render at EVERY width (mobile too),
      // so tablet/phone read like the desktop hero — just scaled down.
      const chipMode = W >= 300;
      const showStatus = W >= 440;
      const s = Math.min(1.1, Math.max(0.66, W / 1180));
      const stalled = spd <= 0 || staticMode;
      // Right-content mirrors the flow onto the left; stacked layouts flatten the
      // vertical spread so the chain reads across a short band.
      const mirror = comp0.placement === "right" && !box.stacked;
      const PX = (x: number) => (box.x + (mirror ? 1 - x : x) * box.w) * W;
      const PY = (y: number) => (box.y + y * box.h) * H;
      const project = (lx: number, ly: number): [number, number] => [PX(lx), PY(ly)];
      // Background layers (lighting, motes, edges) run full-bleed and stay mostly
      // visible even behind the copy (the scrim blurs them); only labelled node
      // panels drop out there.
      const softDim = (px: number, py: number) => 0.66 + 0.34 * dimAt(px, py);

      const hasSafe = comp0.hasSafe;
      const legacySafe = safe ?? { x: 0.02, y: 0.12, w: 0.52, h: 0.76 };
      const inSafe = (x: number, y: number) =>
        x > legacySafe.x && x < legacySafe.x + legacySafe.w && y > legacySafe.y && y < legacySafe.y + legacySafe.h;
      const dimAt = (px: number, py: number) => {
        const fx = px / W;
        const fy = py / H;
        return hasSafe ? fall(fx, fy) : inSafe(fx, fy) ? 0.28 : 1;
      };
      const labelVisible = (px: number, py: number) =>
        labelsOn && (!hideNear || !hasSafe || !labelHiddenAt(comp0, px / W, py / H));

      /* Baked stage lighting — a lit backdrop so the component reads as premium
         wherever it is used (catalog, hero, or a customer install), not a flat box.
         A cool spotlight sits over the graphic's focal side; a soft floor lift and
         a corner vignette add depth. Token-driven → correct in light and dark. */
      const focalX = (hasSafe ? comp0.focal.x : 0.5) * W;
      const focalY = (hasSafe ? comp0.focal.y : 0.5) * H;
      const R = Math.hypot(W, H);
      const spot = ctx.createRadialGradient(focalX, focalY * 0.86, 0, focalX, focalY * 0.86, R * 0.62);
      spot.addColorStop(0, withAlpha(palette.accent, 0.16 * glow));
      spot.addColorStop(0.42, withAlpha(palette.cyan, 0.05 * glow));
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);
      const floor = ctx.createLinearGradient(0, H, 0, H * 0.35);
      floor.addColorStop(0, withAlpha(palette.accent, 0.05 * glow));
      floor.addColorStop(1, "transparent");
      ctx.fillStyle = floor;
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(W / 2, H / 2, R * 0.32, W / 2, H / 2, R * 0.72);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, withAlpha(palette.bg, 0.55));
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      /* Ambient signal motes — fill the whole field so no region reads as dead,
         quieted behind the copy by the same density falloff as everything else. */
      ambient.forEach((a) => {
        const drift = stalled ? 0 : Math.sin(timeSec * a.sp + a.ph * TAU) * 0.008;
        const cx = a.x * W;
        const cy = (a.y + drift) * H;
        const d = softDim(cx, cy);
        const tw = 0.45 + 0.55 * Math.abs(Math.sin((stalled ? a.ph * 6 : timeSec) * a.sp * 1.4 + a.ph * 9));
        ctx.save();
        ctx.globalAlpha = clamp(0.2 * glow * d * tw, 0, 0.55);
        ctx.fillStyle = a.warm ? palette.accent : palette.cyan;
        ctx.beginPath();
        ctx.arc(cx, cy, a.r * s, 0, TAU);
        ctx.fill();
        ctx.restore();
      });

      // Which nodes are drawn at this width — fill the field on every layout.
      const shown = (_n: NodeModel) => true;
      const pointer = pointerRef.current;
      let hotId: string | null = null;
      if (inter && pointer.on) {
        let best = 0.08;
        model.nodes.forEach((n, id) => {
          if (!shown(n)) return;
          const [npx, npy] = project(n.x, n.y);
          const d = Math.hypot(npx / W - pointer.x, npy / H - pointer.y);
          if (d < best) { best = d; hotId = id; }
        });
      }

      /* Region depth — a soft column pool + quiet header, no hard enclosure. */
      if (chipMode) {
        model.regions.forEach((r) => {
          const cx = PX(r.cx);
          const top = PY(-0.02);
          const bottom = PY(1.02);
          const grad = ctx.createLinearGradient(0, top, 0, bottom);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(0.5, palette.accent);
          grad.addColorStop(1, "transparent");
          ctx.save();
          ctx.globalAlpha = 0.05 * glow * dimAt(cx, (top + bottom) / 2);
          ctx.fillStyle = grad;
          ctx.fillRect(cx - 46 * s, top, 92 * s, bottom - top);
          ctx.restore();
          if (r.label && labelVisible(cx, top + 12)) {
            ctx.save();
            ctx.globalAlpha = 0.55 * glow;
            ctx.fillStyle = palette.muted;
            ctx.font = `600 ${10 * s}px ui-sans-serif, system-ui, sans-serif`;
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillText(r.label.toUpperCase(), cx, PY(-0.06));
            ctx.restore();
          }
        });
        ctx.textAlign = "left";
      }

      /* Edges — base strokes. Solid (healthy/active) vs dashed (degraded/failed). */
      model.edges.forEach((e) => {
        if (!shown(model.nodes.get(e.fromId)!) || !shown(model.nodes.get(e.toId)!)) return;
        const mid = bezier(e, 0.5);
        const [mdx, mdy] = project(mid[0], mid[1]);
        const edim = softDim(mdx, mdy);
        const touchHot = hotId !== null && (e.fromId === hotId || e.toId === hotId);
        const [pax, pay] = project(e.ax, e.ay);
        const [pc1x, pc1y] = project(e.c1x, e.c1y);
        const [pc2x, pc2y] = project(e.c2x, e.c2y);
        const [pbx, pby] = project(e.bx, e.by);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pax, pay);
        ctx.bezierCurveTo(pc1x, pc1y, pc2x, pc2y, pbx, pby);
        ctx.lineWidth = (e.role === "active" ? 1.6 : 1.2) * s;
        ctx.lineCap = "round";
        if (e.role === "failed") { ctx.setLineDash([2 * s, 5 * s]); ctx.strokeStyle = palette.error; ctx.globalAlpha = 0.5 * glow * edim; }
        else if (e.role === "degraded") { ctx.setLineDash([5 * s, 6 * s]); ctx.strokeStyle = palette.warning; ctx.globalAlpha = 0.42 * glow * edim; }
        else if (e.role === "active") { ctx.strokeStyle = palette.accent; ctx.globalAlpha = (touchHot ? 0.55 : 0.4) * glow * edim; }
        else { ctx.strokeStyle = palette.cyan; ctx.globalAlpha = (touchHot ? 0.4 : 0.22) * glow * edim; }
        ctx.stroke();
        ctx.restore();

        // Failed route: a stop marker where the request gives up.
        if (e.role === "failed") {
          const [mx, my] = bezier(e, 0.55);
          const [cx, cy] = project(mx, my);
          ctx.save();
          ctx.globalAlpha = 0.9 * glow * dimAt(cx, cy);
          ctx.strokeStyle = palette.error;
          ctx.lineWidth = 1.7 * s;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - 3.4 * s, cy - 3.4 * s); ctx.lineTo(cx + 3.4 * s, cy + 3.4 * s);
          ctx.moveTo(cx + 3.4 * s, cy - 3.4 * s); ctx.lineTo(cx - 3.4 * s, cy + 3.4 * s);
          ctx.stroke();
          ctx.restore();
        }
      });

      /* Ambient supporting signals (cyan) — sparse dots on healthy/active edges. */
      const t = timeSec * clamp(spd, 0, 4);
      model.edges.forEach((e) => {
        if (e.role === "failed" || e.role === "degraded") return;
        if (!shown(model.nodes.get(e.fromId)!) || !shown(model.nodes.get(e.toId)!)) return;
        const budget = clamp(Math.round(1 + den * act * 0.6), 1, 3);
        for (let k = 0; k < budget; k++) {
          const base = (e.phase + k / budget) % 1;
          const prog = stalled ? base : (base + t * e.rate * 0.11) % 1;
          const [nx, ny] = bezier(e, prog);
          const [cx, cy] = project(nx, ny);
          ctx.save();
          ctx.globalAlpha = clamp(0.4 * glow * dimAt(cx, cy), 0, 1);
          ctx.fillStyle = palette.cyan;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.5 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      /* Degraded route (amber) — one slow packet per degraded edge. */
      model.edges.forEach((e) => {
        if (e.role !== "degraded") return;
        if (!shown(model.nodes.get(e.fromId)!) || !shown(model.nodes.get(e.toId)!)) return;
        const base = e.phase;
        const prog = stalled ? 0.5 : (base + t * e.rate * 0.06) % 1;
        const [nx, ny] = bezier(e, prog);
        const [cx, cy] = project(nx, ny);
        ctx.save();
        ctx.globalAlpha = clamp(0.6 * glow * dimAt(cx, cy), 0, 1);
        ctx.fillStyle = palette.warning;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.8 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      /* Failed route (coral) — a packet that runs to the stop marker, then resets. */
      model.edges.forEach((e) => {
        if (e.role !== "failed") return;
        if (!shown(model.nodes.get(e.fromId)!) || !shown(model.nodes.get(e.toId)!)) return;
        const cycle = stalled ? 0.62 : (t * 0.14 + e.phase) % 1;
        const prog = Math.min(0.55, cycle * 0.9);
        const fade = cycle > 0.62 ? clamp(1 - (cycle - 0.62) / 0.2, 0, 1) : 1;
        const [nx, ny] = bezier(e, prog);
        const [cx, cy] = project(nx, ny);
        ctx.save();
        ctx.globalAlpha = clamp(0.85 * glow * fade * dimAt(cx, cy), 0, 1);
        ctx.fillStyle = palette.error;
        ctx.beginPath();
        ctx.arc(cx, cy, 2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      /* The current active request — one azure comet along the healthy path. */
      const nodePulse = new Map<string, number>();
      const seg: EdgeModel[] = [];
      for (let i = 0; i < model.activePath.length - 1; i++) {
        const from = model.activePath[i];
        const to = model.activePath[i + 1];
        const e = model.edges.find(
          (ed) => (ed.fromId === from && ed.toId === to) || (ed.fromId === to && ed.toId === from),
        );
        if (e) seg.push(e.fromId === from ? e : { ...e, ax: e.bx, ay: e.by, bx: e.ax, by: e.ay, c1x: e.c2x, c1y: e.c2y, c2x: e.c1x, c2y: e.c1y });
      }
      if (seg.length) {
        const segLen = seg.map((e) => {
          let len = 0;
          let prev = project(...bezier(e, 0));
          for (let i = 1; i <= 8; i++) {
            const p = project(...bezier(e, i / 8));
            len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
            prev = p;
          }
          return len;
        });
        const total = segLen.reduce((a, b) => a + b, 0) || 1;
        const cum: number[] = [0];
        segLen.forEach((l, i) => cum.push(cum[i] + l / total));
        const pathPoint = (u: number): [number, number] => {
          const uu = clamp(u, 0, 1) * total;
          let acc = 0;
          for (let i = 0; i < seg.length; i++) {
            if (uu <= acc + segLen[i] || i === seg.length - 1) {
              const local = segLen[i] ? (uu - acc) / segLen[i] : 0;
              const p = bezier(seg[i], clamp(local, 0, 1));
              return project(p[0], p[1]);
            }
            acc += segLen[i];
          }
          const p = bezier(seg[seg.length - 1], 1);
          return project(p[0], p[1]);
        };

        const PERIOD = 7.2;
        const cycle = stalled ? 0.6 : ((timeSec * clamp(spd, 0, 4)) / PERIOD) % 1;
        const tp = smoothstep(clamp(cycle / 0.82, 0, 1));
        const arrival = cycle > 0.82 ? clamp((cycle - 0.82) / 0.18, 0, 1) : 0;

        // Light each service as the request reaches it.
        model.activePath.forEach((id, i) => {
          const reach = cum[i];
          const d = tp - reach;
          if (d >= -0.02 && d < 0.16) nodePulse.set(id, smoothstep(1 - Math.abs(d - 0.06) / 0.1));
        });
        if (arrival > 0) nodePulse.set(model.activePath[model.activePath.length - 1], 1);

        // Comet: bright head + fading trail.
        const TRAIL = 16;
        for (let k = TRAIL; k >= 0; k--) {
          const u = tp - k * 0.014;
          if (u < 0) continue;
          const [cx, cy] = pathPoint(u);
          const f = 1 - k / TRAIL;
          ctx.save();
          ctx.globalAlpha = clamp((k === 0 ? 0.95 : 0.5 * f * f) * glow * dimAt(cx, cy), 0, 1);
          ctx.fillStyle = palette.accent;
          ctx.beginPath();
          ctx.arc(cx, cy, (k === 0 ? 3 : 2.2 * f) * s, 0, Math.PI * 2);
          ctx.fill();
          if (k === 0) {
            ctx.globalAlpha = clamp(0.28 * glow * dimAt(cx, cy), 0, 1);
            ctx.beginPath();
            ctx.arc(cx, cy, 6.5 * s, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        // Arrival ring at the destination.
        if (arrival > 0) {
          const [cx, cy] = pathPoint(1);
          ctx.save();
          ctx.globalAlpha = clamp((1 - arrival) * 0.55 * glow * dimAt(cx, cy), 0, 1);
          ctx.strokeStyle = palette.success;
          ctx.lineWidth = 1.6 * s;
          ctx.beginPath();
          ctx.arc(cx, cy, (6 + arrival * 16) * s, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      /* Service nodes — refined cards (chip mode) or compact markers (mobile). */
      model.order.forEach((id) => {
        const n = model.nodes.get(id);
        if (!n || !shown(n)) return;
        const [cx, cy] = project(n.x, n.y);
        const raw = dimAt(cx, cy);
        // Nodes near the copy don't vanish — they linger as soft glowing shapes
        // (the scrim blurs them) so the flow stays visible even under centered
        // copy; their labels are still dropped so no text collides.
        const behind = raw < 0.4;
        const ndim = 0.2 + 0.8 * raw;
        const hot = id === hotId;
        const hc = healthColor(palette, n.health);
        const pulse = nodePulse.get(id) ?? 0;
        const isErr = n.health === "error";
        const isDeg = n.health === "degraded";

        // Behind the copy: a visible soft-glowing service token (icon + ring +
        // glow, no label) — the frosted-glass scrim blurs the ones under the
        // title, so the whole field reads as a live network behind the copy.
        if (behind) {
          const bd = clamp(0.72 + 0.28 * raw, 0.72, 1);
          const col = pulse > 0.2 ? palette.accent : hc;
          const r = (chipMode ? 18 : 12) * s;
          ctx.save();
          const gb = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6);
          gb.addColorStop(0, withAlpha(col, clamp((0.55 + pulse * 0.4) * glow * bd, 0, 0.95)));
          gb.addColorStop(0.5, withAlpha(col, clamp(0.2 * glow * bd, 0, 0.5)));
          gb.addColorStop(1, "transparent");
          ctx.fillStyle = gb;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 2.6, 0, TAU);
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, TAU);
          ctx.globalAlpha = clamp(0.82 * bd, 0, 1);
          ctx.fillStyle = palette.surface;
          ctx.fill();
          ctx.lineWidth = 2 * s;
          ctx.globalAlpha = clamp(bd, 0, 1);
          ctx.strokeStyle = col;
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.translate(cx, cy);
          ctx.globalAlpha = clamp(bd, 0, 1);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.8 * s;
          if (isErr) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.32, -r * 0.32); ctx.lineTo(r * 0.32, r * 0.32);
            ctx.moveTo(r * 0.32, -r * 0.32); ctx.lineTo(-r * 0.32, r * 0.32);
            ctx.stroke();
          } else {
            drawIcon(ctx, n.icon, r * 0.5);
          }
          ctx.restore();
          return;
        }

        if (chipMode && n.tier === "primary") {
          // Measure the card from its text.
          ctx.font = `600 ${12.5 * s}px ui-sans-serif, system-ui, sans-serif`;
          const labelW = ctx.measureText(n.label ?? id).width;
          ctx.font = `500 ${10.5 * s}px ui-sans-serif, system-ui, sans-serif`;
          const statusW = showStatus && n.status ? ctx.measureText(n.status).width : 0;
          const iconBox = 26 * s;
          const padX = 11 * s;
          const gap = 9 * s;
          const w = padX * 2 + iconBox + gap + Math.max(labelW, statusW);
          const h = (showStatus && n.status ? 42 : 34) * s;
          let bx = clamp(cx - w / 2, 6, W - 6 - w);
          const by = cy - h / 2;

          // Depth: soft under-glow tinted by health / activity — brighter so each
          // card reads as a lit, present chip rather than a flat panel.
          const glowC = pulse > 0.02 ? palette.accent : hc;
          ctx.save();
          ctx.globalAlpha = clamp((0.2 + pulse * 0.32) * glow * ndim, 0, 1);
          ctx.fillStyle = glowC;
          ctx.filter = "blur(13px)";
          ctx.beginPath();
          ctx.roundRect(bx - 4, by + 3, w + 8, h + 6, 15 * s);
          ctx.fill();
          ctx.restore();

          // Card surface + a health-tinted border so it pops on a dark field.
          const borderC = pulse > 0.3 || hot ? palette.accent : hc;
          ctx.save();
          ctx.globalAlpha = clamp(0.97 * ndim, 0, 1);
          ctx.beginPath();
          ctx.roundRect(bx, by, w, h, 11 * s);
          ctx.fillStyle = palette.surface;
          ctx.fill();
          ctx.lineWidth = (pulse > 0.3 || hot ? 1.8 : 1.4) * s;
          ctx.globalAlpha = clamp((pulse > 0.3 || isErr || isDeg || hot ? 0.95 : 0.6) * ndim, 0, 1);
          ctx.strokeStyle = borderC;
          ctx.stroke();
          ctx.restore();

          // Icon chip.
          const icx = bx + padX + iconBox / 2;
          const icy = cy;
          ctx.save();
          ctx.globalAlpha = clamp(0.14 * ndim, 0, 1);
          ctx.fillStyle = hc;
          ctx.beginPath();
          ctx.roundRect(icx - iconBox / 2, icy - iconBox / 2, iconBox, iconBox, 7 * s);
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.translate(icx, icy);
          ctx.globalAlpha = clamp(0.95 * ndim, 0, 1);
          ctx.strokeStyle = hc;
          drawIcon(ctx, n.icon, 7 * s);
          ctx.restore();

          // Label + status.
          const tx = bx + padX + iconBox + gap;
          ctx.save();
          ctx.globalAlpha = clamp(ndim, 0, 1);
          ctx.fillStyle = palette.fg;
          ctx.font = `600 ${12.5 * s}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textBaseline = showStatus && n.status ? "alphabetic" : "middle";
          ctx.fillText(n.label ?? id, tx, showStatus && n.status ? cy - 2 * s : cy);
          if (showStatus && n.status) {
            ctx.globalAlpha = clamp(0.75 * ndim, 0, 1);
            ctx.font = `500 ${10.5 * s}px ui-sans-serif, system-ui, sans-serif`;
            ctx.fillStyle = isErr ? palette.error : isDeg ? palette.warning : palette.muted;
            ctx.textBaseline = "top";
            ctx.fillText(n.status, tx, cy + 4 * s);
          }
          ctx.restore();

          // Health dot (top-right) — a non-color cue is carried by dash/glyph too.
          ctx.save();
          ctx.globalAlpha = clamp(0.95 * ndim, 0, 1);
          ctx.fillStyle = hc;
          ctx.beginPath();
          ctx.arc(bx + w - 9 * s, by + 9 * s, 2.4 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          void bx;
        } else {
          // Compact node — a lit token with an icon + short label (mobile). Larger
          // and richer than a bare dot so the field reads as premium, not sparse.
          const active = pulse > 0.3;
          const r = (n.tier === "primary" ? 12 : 9.5) * s + (hot ? 1.5 : 0) + pulse * 2;
          const ringC = active ? palette.accent : hc;

          // Soft health-tinted under-glow for depth.
          ctx.save();
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
          g.addColorStop(0, withAlpha(active ? palette.accent : hc, (0.22 + pulse * 0.3) * glow * ndim));
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 2.4, 0, TAU);
          ctx.fill();
          ctx.restore();

          // Request ripple as the active node lights up.
          if (pulse > 0.02 && n.tier === "primary") {
            ctx.save();
            ctx.globalAlpha = clamp(pulse * 0.5 * glow * ndim, 0, 1);
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 1.6 * s;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 6 + pulse * 10, 0, TAU);
            ctx.stroke();
            ctx.restore();
          }

          // Token body: elevated surface + health ring.
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, TAU);
          ctx.globalAlpha = clamp(0.97 * ndim, 0, 1);
          ctx.fillStyle = palette.surface;
          ctx.fill();
          ctx.lineWidth = (active || isErr || isDeg ? 2 : 1.5) * s;
          ctx.globalAlpha = clamp(ndim, 0, 1);
          ctx.strokeStyle = ringC;
          ctx.stroke();
          ctx.restore();

          // Centre glyph — icon for services, health mark for degraded/error.
          ctx.save();
          ctx.translate(cx, cy);
          ctx.globalAlpha = clamp(0.96 * ndim, 0, 1);
          ctx.strokeStyle = active ? palette.accent : hc;
          ctx.lineWidth = 1.5 * s;
          if (isErr) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.34); ctx.lineTo(r * 0.34, r * 0.34);
            ctx.moveTo(r * 0.34, -r * 0.34); ctx.lineTo(-r * 0.34, r * 0.34);
            ctx.stroke();
          } else {
            drawIcon(ctx, n.icon, r * 0.5);
          }
          ctx.restore();

          if (n.label && (n.tier === "primary" || W >= 430) && labelVisible(cx, cy + r + 10)) {
            ctx.save();
            ctx.globalAlpha = clamp(0.85 * ndim, 0, 1);
            ctx.fillStyle = palette.fg;
            ctx.font = `600 ${11 * s}px ui-sans-serif, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(n.label, cx, cy + r + 6 * s);
            ctx.restore();
            ctx.textAlign = "left";
          }
        }
      });

      /* Live-metric chips — a few glassy stat pills for a real dashboard feel
         (demo topology only; app data keeps its own foreground). */
      if (demo && chipMode) {
        const chips: Array<[number, number, string, string]> = [
          [0.72, 0.08, "1.2M", "req / min"],
          [0.7, 0.94, "42ms", "p99 latency"],
          [0.87, 0.63, "99.98%", "uptime 30d"],
        ];
        chips.forEach(([lx, ly, big, small]) => {
          const cx = PX(lx);
          const cy = PY(ly);
          const cd = dimAt(cx, cy);
          if (cd < 0.55) return; // never float a stat over the copy
          ctx.font = `700 ${13 * s}px ui-sans-serif, system-ui, sans-serif`;
          const bw = ctx.measureText(big).width;
          ctx.font = `500 ${11 * s}px ui-sans-serif, system-ui, sans-serif`;
          const sw = ctx.measureText(small).width;
          const dot = 5 * s;
          const padX = 12 * s;
          const gap = 8 * s;
          const w = padX * 2 + dot + gap + bw + 6 * s + sw;
          const h = 26 * s;
          const bx = clamp(cx - w / 2, 6, W - 6 - w);
          const by = cy - h / 2;
          ctx.save();
          ctx.globalAlpha = clamp(0.1 * glow * cd, 0, 1);
          ctx.filter = "blur(9px)";
          ctx.fillStyle = palette.accent;
          ctx.beginPath();
          ctx.roundRect(bx - 2, by + 2, w + 4, h + 2, 12 * s);
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = clamp(0.9 * cd, 0, 1);
          ctx.beginPath();
          ctx.roundRect(bx, by, w, h, h / 2);
          ctx.fillStyle = palette.surface;
          ctx.fill();
          ctx.lineWidth = 1 * s;
          ctx.strokeStyle = palette.border;
          ctx.stroke();
          const iy = by + h / 2;
          ctx.globalAlpha = clamp(cd, 0, 1);
          ctx.fillStyle = palette.success;
          ctx.beginPath();
          ctx.arc(bx + padX + dot / 2, iy, dot / 2, 0, TAU);
          ctx.fill();
          const tx = bx + padX + dot + gap;
          ctx.textBaseline = "middle";
          ctx.fillStyle = palette.fg;
          ctx.font = `700 ${13 * s}px ui-sans-serif, system-ui, sans-serif`;
          ctx.fillText(big, tx, iy + 0.5);
          ctx.globalAlpha = clamp(0.7 * cd, 0, 1);
          ctx.fillStyle = palette.muted;
          ctx.font = `500 ${11 * s}px ui-sans-serif, system-ui, sans-serif`;
          ctx.fillText(small, tx + bw + 6 * s, iy + 0.5);
          ctx.restore();
        });
      }
    };

    let raf = 0;
    let startTime = 0;
    const loop = (now: number) => {
      if (!startTime) startTime = now;
      draw((now - startTime) / 1000);
      raf = requestAnimationFrame(loop);
    };

    if (animate) raf = requestAnimationFrame(loop);
    else draw(0);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          measure();
          if (!animate) draw(0);
        })
      : null;
    ro?.observe(wrap);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [model, animate, staticMode]);

  const css = `
.${cls} { position: absolute; inset: 0; }
.${cls} .mk-rsm-canvas { display: block; width: 100%; height: 100%; }
.${cls} .mk-rsm-fallback { display: none; }
@media (forced-colors: active) {
  .${cls} .mk-rsm-canvas { display: none; }
  .${cls} .mk-rsm-fallback {
    display: block; position: absolute; inset: 7%;
    border: 1px solid CanvasText; border-radius: 14px; background: Canvas;
  }
}`.trim();

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style} {...props}>
      <div
        ref={wrapRef}
        aria-hidden="true"
        data-paused={paused ? "true" : "false"}
        data-motion={staticMode ? "static" : "animated"}
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", cls)}
      >
        {/* Full-bleed canvas — no mask; the field runs edge-to-edge so the flow
            is visible on every side (including center). */}
        <canvas ref={canvasRef} className="mk-rsm-canvas" />
        <div className="mk-rsm-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {children != null ? (
        <>
          {/* Glass scrim behind the copy: a soft wash + feathered backdrop blur so
              text stays readable while the animated field continues underneath —
              no hard cut. */}
          {scrimStyle ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={scrimStyle} />
          ) : null}
          <div className="relative z-10">{children}</div>
        </>
      ) : null}
    </div>
  );
}

export default RuntimeSignalMap;
