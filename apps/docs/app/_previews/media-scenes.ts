"use client";

/**
 * Deterministic demo art for the `media/*` previews.
 *
 * The Motion Lab prototype generated every picture in-canvas so the page never
 * fetched a byte; the registry components are generic (they take consumer media),
 * so the generators live HERE, in the docs previews, and hand the components
 * plain data-URL images. Everything is seeded (mulberry32 — no Math.random, no
 * Date.now) and generated post-mount, so SSR and the first client render match.
 *
 * Clean-room original, ported 1:1 from artifacts/motion-lab-showpieces/
 * 04-media-in-motion.html.
 */
import * as React from "react";

export type SceneKind = "land" | "geo" | "city" | "orbs" | "blueprint";

export interface SceneSpec {
  kind: SceneKind;
  /** land: 0 = pre-dawn … 1 = deep night. */
  t?: number;
  /** land / blueprint ridge seed. */
  seed?: number;
  /** geo variant 0–2. */
  v?: number;
}

type Hsl = [number, number, number];

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hsl = (c: Hsl) => `hsl(${c[0].toFixed(1)},${c[1].toFixed(1)}%,${c[2].toFixed(1)}%)`;
const hsla = (c: Hsl, a: number) => `hsla(${c[0].toFixed(1)},${c[1].toFixed(1)}%,${c[2].toFixed(1)}%,${a})`;

function hsl2rgb(c: Hsl): [number, number, number] {
  const h = ((c[0] % 360) + 360) % 360;
  const s = c[1] / 100;
  const l = c[2] / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function rgb2hsl(c: [number, number, number]): Hsl {
  const r = c[0] / 255;
  const g = c[1] / 255;
  const b = c[2] / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d > 0.0001) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number, n: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(rnd() * w, rnd() * h, 1, 1);
  }
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(4,8,16,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

interface Sky {
  top: Hsl;
  hor: Hsl;
  sun: Hsl;
  alt: number;
}

/** Time-of-day sky keyframes; mixed in RGB so hues cross neutral, never green. */
function skyAt(t: number, light: boolean): Sky {
  const K = [
    { t: 0.0, top: [222, 58, 12] as Hsl, hor: [36, 72, 50] as Hsl, sun: [42, 95, 72] as Hsl, alt: 0.06 },
    { t: 0.3, top: [210, 72, 46] as Hsl, hor: [194, 58, 68] as Hsl, sun: [50, 100, 86] as Hsl, alt: 0.85 },
    { t: 0.62, top: [226, 60, 17] as Hsl, hor: [26, 80, 48] as Hsl, sun: [30, 95, 60] as Hsl, alt: 0.28 },
    { t: 0.85, top: [224, 48, 9] as Hsl, hor: [218, 42, 17] as Hsl, sun: [208, 28, 88] as Hsl, alt: 0.5 },
    { t: 1.0, top: [224, 46, 6] as Hsl, hor: [218, 40, 13] as Hsl, sun: [208, 28, 90] as Hsl, alt: 0.66 },
  ];
  let a = K[0];
  let b = K[K.length - 1];
  for (let i = 0; i < K.length - 1; i++) {
    if (t >= K[i].t && t <= K[i + 1].t) {
      a = K[i];
      b = K[i + 1];
      break;
    }
  }
  const u = clamp((t - a.t) / Math.max(0.0001, b.t - a.t), 0, 1);
  const mix = (p: Hsl, q: Hsl): Hsl => {
    const pr = hsl2rgb(p);
    const qr = hsl2rgb(q);
    return rgb2hsl([lerp(pr[0], qr[0], u), lerp(pr[1], qr[1], u), lerp(pr[2], qr[2], u)]);
  };
  const s: Sky = { top: mix(a.top, b.top), hor: mix(a.hor, b.hor), sun: mix(a.sun, b.sun), alt: lerp(a.alt, b.alt, u) };
  if (light) {
    s.top[2] = Math.min(86, s.top[2] + 12);
    s.hor[2] = Math.min(90, s.hor[2] + 9);
  }
  return s;
}

/** Deterministic ridge silhouette — shared by the render and its wireframe. */
function ridgePoints(seed: number, L: number, w: number, h: number): Array<[number, number]> {
  const rnd = mulberry32((Math.floor(seed * 131) + L * 977) | 0);
  const base = h * (0.52 + L * 0.115);
  const amp = h * (0.045 + L * 0.03);
  const f1 = 1 + rnd() * 1.2;
  const f2 = 2.6 + rnd() * 2;
  const f3 = 5.5 + rnd() * 3;
  const p1 = rnd() * 7;
  const p2 = rnd() * 7;
  const p3 = rnd() * 7;
  const pts: Array<[number, number]> = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w;
    const u = (i / n) * Math.PI * 2;
    const y =
      base +
      Math.sin(u * f1 + p1) * amp * 0.6 +
      Math.sin(u * f2 + p2) * amp * 0.32 +
      Math.abs(Math.sin(u * f3 + p3)) * amp * 0.26;
    pts.push([x, y]);
  }
  return pts;
}

function paintLandscape(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seed: number, dark: boolean) {
  const s = skyAt(t, !dark);
  const rnd = mulberry32(Math.floor(seed * 7919) + 29);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hsl(s.top));
  g.addColorStop(0.58, hsl(s.hor));
  g.addColorStop(1, hsl([s.hor[0], s.hor[1] * 0.6, Math.max(6, s.hor[2] * 0.45)]));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (t > 0.78) {
    ctx.save();
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.15 + rnd() * 0.5;
      ctx.fillStyle = "#e6efff";
      ctx.fillRect(rnd() * w, rnd() * h * 0.55, rnd() > 0.9 ? 2 : 1, 1);
    }
    ctx.restore();
  }

  const sx = w * lerp(0.16, 0.84, t);
  const sy = h * (0.66 - s.alt * 0.5);
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.5);
  glow.addColorStop(0, hsla(s.sun, 0.5));
  glow.addColorStop(1, hsla(s.sun, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(6, w * 0.045), 0, 7);
  ctx.fillStyle = hsl([s.sun[0], s.sun[1], Math.min(96, s.sun[2] + 8)]);
  ctx.fill();

  for (let L = 0; L < 4; L++) {
    const pts = ridgePoints(seed, L, w, h);
    const shade = Math.max(4, (dark ? 1 : 1.7) * s.hor[2] * (0.55 - L * 0.13));
    ctx.beginPath();
    ctx.moveTo(0, h);
    pts.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = hsl([s.hor[0], Math.min(60, s.hor[1] * 0.55), shade]);
    ctx.fill();
  }

  grain(ctx, w, h, rnd, Math.floor((w * h) / 900), 0.05);
  vignette(ctx, w, h, dark ? 0.32 : 0.14);
}

function paintGeo(ctx: CanvasRenderingContext2D, w: number, h: number, v: number, dark: boolean) {
  const rnd = mulberry32(101 + v * 53);
  const hues = [
    [212, 187],
    [187, 42],
    [152, 212],
  ][v % 3];

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, hsl([hues[0], 55, dark ? 16 : 80]));
  g.addColorStop(1, hsl([hues[0], 60, dark ? 8 : 64]));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (v === 0) {
    const cx = w * 0.38;
    const cy = h * 0.42;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (i + 1) * Math.min(w, h) * 0.09, 0, 7);
      ctx.strokeStyle = hsla([hues[i % 3 === 0 ? 1 : 0], 70, dark ? 62 : 38], Math.max(0.08, 0.5 - i * 0.045));
      ctx.lineWidth = 2 + (i % 3 === 0 ? 5 : 0);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.72, w * 0.09, 0, 7);
    ctx.fillStyle = hsla([hues[1], 70, dark ? 60 : 36], 0.85);
    ctx.fill();
  } else if (v === 1) {
    for (let i = 0; i < 14; i++) {
      const bw = w * 0.11;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.5);
      ctx.translate(-w, -h);
      ctx.fillStyle = hsla([hues[i % 2], 65, dark ? 55 : 40], i % 2 ? 0.14 : 0.32);
      ctx.fillRect(i * bw * 1.18, 0, bw, h * 2.6);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.3, w * 0.13, 0, 7);
    ctx.strokeStyle = hsla([hues[1], 80, dark ? 70 : 34], 0.9);
    ctx.lineWidth = 5;
    ctx.stroke();
  } else {
    const stepSize = Math.min(w, h) / 13;
    for (let y = stepSize / 2; y < h; y += stepSize) {
      for (let x = stepSize / 2; x < w; x += stepSize) {
        const r = 1.2 + (Math.sin(x * 0.022 + y * 0.013) + 1) * stepSize * 0.17;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 7);
        ctx.fillStyle = hsla([hues[1], 62, dark ? 60 : 36], 0.5);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  grain(ctx, w, h, rnd, Math.floor((w * h) / 1200), 0.05);
  vignette(ctx, w, h, dark ? 0.3 : 0.1);
}

function paintCity(ctx: CanvasRenderingContext2D, w: number, h: number, dark: boolean) {
  const rnd = mulberry32(913);
  const s = skyAt(0.68, !dark);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hsl(s.top));
  g.addColorStop(0.7, hsl(s.hor));
  g.addColorStop(1, hsl([s.hor[0], s.hor[1] * 0.5, Math.max(6, s.hor[2] * 0.4)]));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const sx = w * 0.68;
  const sy = h * 0.5;
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.4);
  glow.addColorStop(0, hsla(s.sun, 0.45));
  glow.addColorStop(1, hsla(s.sun, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(sx, sy, w * 0.05, 0, 7);
  ctx.fillStyle = hsl(s.sun);
  ctx.fill();

  const horizon = h * 0.58;
  let x = -w * 0.02;
  while (x < w) {
    const bw = w * (0.05 + rnd() * 0.1);
    const bh = h * (0.12 + rnd() * 0.42);
    ctx.fillStyle = hsl([222, 35, dark ? 7 : 20]);
    ctx.fillRect(x, horizon - bh, bw, bh + h);
    for (let wy = horizon - bh + 6; wy < h * 0.92; wy += 11) {
      for (let wx = x + 4; wx < x + bw - 5; wx += 9) {
        if (rnd() < 0.32) {
          ctx.fillStyle = hsla([42, 90, 66], 0.75);
          ctx.fillRect(wx, wy, 3, 4);
        }
      }
    }
    x += bw + w * 0.012;
  }

  grain(ctx, w, h, rnd, Math.floor((w * h) / 1000), 0.05);
  vignette(ctx, w, h, dark ? 0.34 : 0.16);
}

function paintOrbs(ctx: CanvasRenderingContext2D, w: number, h: number, dark: boolean) {
  const rnd = mulberry32(577);
  ctx.fillStyle = dark ? "#0a101c" : "#dbe6f5";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
  for (let i = 0; i < 16; i++) {
    const r = w * (0.05 + rnd() * 0.16);
    const x = rnd() * w;
    const y = rnd() * h;
    const hue = i === 7 ? 42 : 188 + rnd() * 34;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hsla([hue, 80, dark ? 60 : 52], dark ? 0.5 : 0.32));
    g.addColorStop(1, hsla([hue, 80, 60], 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }
  ctx.restore();

  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(w * (0.25 + k * 0.24), h * (0.3 + k * 0.2), w * (0.08 + k * 0.05), 0, 7);
    ctx.strokeStyle = hsla([200, 60, dark ? 70 : 35], 0.28);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  grain(ctx, w, h, rnd, Math.floor((w * h) / 1100), 0.05);
  vignette(ctx, w, h, dark ? 0.3 : 0.1);
}

interface Tokens {
  bgElev: string;
  border: string;
  muted: string;
  accent: string;
  accentText: string;
  dark: boolean;
}

/** The v1 wireframe pass — same ridge geometry as the v2 render. */
function paintBlueprint(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, T: Tokens) {
  ctx.fillStyle = T.bgElev;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = T.border;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  const gstep = Math.max(24, Math.round(w / 34));
  ctx.beginPath();
  for (let gx = 0; gx <= w; gx += gstep) {
    ctx.moveTo(gx + 0.5, 0);
    ctx.lineTo(gx + 0.5, h);
  }
  for (let gy = 0; gy <= h; gy += gstep) {
    ctx.moveTo(0, gy + 0.5);
    ctx.lineTo(w, gy + 0.5);
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = T.muted;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.lineTo(w, h * 0.52);
  ctx.stroke();
  ctx.restore();

  const t = 0.62;
  const s = skyAt(t, !T.dark);
  const sx = w * lerp(0.16, 0.84, t);
  const sy = h * (0.66 - s.alt * 0.5);
  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = T.accentText;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(6, w * 0.045), 0, 7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(sx - 14, sy);
  ctx.lineTo(sx + 14, sy);
  ctx.moveTo(sx, sy - 14);
  ctx.lineTo(sx, sy + 14);
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.restore();

  for (let L = 0; L < 4; L++) {
    const pts = ridgePoints(seed, L, w, h);
    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.strokeStyle = T.accentText;
    ctx.globalAlpha = 0.95 - L * 0.16;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = T.accent;
    ctx.globalAlpha = 0.035;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = T.muted;
  ctx.globalAlpha = 0.95;
  ctx.fillText("scene-04 / valley — v1 wireframe", 14, 22);
  ctx.fillText("grad: sky-01 (deferred)", 14, 38);
  for (let L = 0; L < 4; L++) {
    const pts = ridgePoints(seed, L, w, h);
    const mid = pts[Math.floor(pts.length * (0.22 + L * 0.18))];
    ctx.fillText(`L${L}`, mid[0], mid[1] - 8);
  }
  const my = h - 26;
  ctx.strokeStyle = T.muted;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, my);
  ctx.lineTo(w * 0.5, my);
  ctx.moveTo(w * 0.12, my - 5);
  ctx.lineTo(w * 0.12, my + 5);
  ctx.moveTo(w * 0.5, my - 5);
  ctx.lineTo(w * 0.5, my + 5);
  ctx.stroke();
  ctx.fillText("ridge span 38%", w * 0.12, my - 10);
  ctx.restore();
}

/** The v2 polish pass: the render plus a small flock. */
export function paintRenderPass(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, dark: boolean) {
  paintLandscape(ctx, w, h, 0.62, seed, dark);
  ctx.save();
  ctx.strokeStyle = "rgba(240,248,255,0.85)";
  ctx.lineWidth = Math.max(1.5, w / 700);
  const flock: Array<[number, number, number]> = [
    [0.62, 0.24, 9],
    [0.68, 0.2, 7],
    [0.57, 0.19, 6],
  ];
  flock.forEach((b) => {
    const fx = w * b[0];
    const fy = h * b[1];
    const s = b[2] * (w / 700);
    ctx.beginPath();
    ctx.moveTo(fx - s, fy);
    ctx.quadraticCurveTo(fx - s / 2, fy - s * 0.7, fx, fy);
    ctx.quadraticCurveTo(fx + s / 2, fy - s * 0.7, fx + s, fy);
    ctx.stroke();
  });
  ctx.restore();
}

function readTokens(): Tokens {
  const fallback: Tokens = {
    bgElev: "#0d1420",
    border: "#263449",
    muted: "#9caabd",
    accent: "#4f7cff",
    accentText: "#7f9fff",
    dark: true,
  };
  if (typeof window === "undefined") return fallback;
  const cs = getComputedStyle(document.documentElement);
  const g = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  const bg = g("--color-bg", "#080c14");
  let hex = bg.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  const luma = Number.isNaN(num)
    ? 0
    : 0.2126 * ((num >> 16) & 255) + 0.7152 * ((num >> 8) & 255) + 0.0722 * (num & 255);
  return {
    bgElev: g("--color-bg-elevated", fallback.bgElev),
    border: g("--color-border", fallback.border),
    muted: g("--color-muted", fallback.muted),
    accent: g("--color-accent", fallback.accent),
    accentText: g("--color-accent-text", fallback.accentText),
    dark: luma < 128,
  };
}

/** Paint one scene into a fresh canvas and hand back a data URL. */
export function renderScene(spec: SceneSpec, w: number, h: number, tokens: Tokens): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, w, h);
  switch (spec.kind) {
    case "land":
      paintLandscape(ctx, w, h, spec.t ?? 0.4, spec.seed ?? 7, tokens.dark);
      break;
    case "geo":
      paintGeo(ctx, w, h, spec.v ?? 0, tokens.dark);
      break;
    case "city":
      paintCity(ctx, w, h, tokens.dark);
      break;
    case "orbs":
      paintOrbs(ctx, w, h, tokens.dark);
      break;
    case "blueprint":
      paintBlueprint(ctx, w, h, spec.seed ?? 21, tokens);
      break;
  }
  return canvas.toDataURL("image/png");
}

/**
 * Generate the demo art once after mount (never during render — the server has
 * no canvas) and regenerate whenever the docs theme flips.
 */
export function useSceneImages(specs: SceneSpec[], w: number, h: number): string[] {
  const [urls, setUrls] = React.useState<string[]>([]);
  // Specs are static literals per preview; the JSON key keeps the effect from
  // re-running on every render without asking callers to memoize.
  const key = JSON.stringify(specs);

  React.useEffect(() => {
    const list: SceneSpec[] = JSON.parse(key);
    const build = () => {
      const tokens = readTokens();
      setUrls(list.map((s) => renderScene(s, w, h, tokens)));
    };
    build();
    const mo = new MutationObserver(build);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
  }, [key, w, h]);

  return urls;
}

/** The before/after pair for the comparator preview (wireframe + render). */
export function useComparePair(seed: number, w: number, h: number): [string, string] {
  const [pair, setPair] = React.useState<[string, string]>(["", ""]);

  React.useEffect(() => {
    const build = () => {
      const tokens = readTokens();
      const wire = renderScene({ kind: "blueprint", seed }, w, h, tokens);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      paintRenderPass(ctx, w, h, seed, tokens.dark);
      setPair([wire, canvas.toDataURL("image/png")]);
    };
    build();
    const mo = new MutationObserver(build);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
  }, [seed, w, h]);

  return pair;
}

/** Time-of-day phase name used by the filmstrip readout. */
export function phaseName(t: number): string {
  if (t < 0.12) return "dawn";
  if (t < 0.42) return "morning";
  if (t < 0.56) return "midday";
  if (t < 0.7) return "golden hour";
  if (t < 0.84) return "dusk";
  return "night";
}
