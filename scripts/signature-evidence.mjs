#!/usr/bin/env node
/**
 * Signature-component evidence harness — produces the full evidence set required
 * by premium-visual-review in artifacts/signature-components/<slug>/:
 * desktop-{dark,light}.png · tablet.png · mobile.png · forced-colors.png ·
 * zoom-200.png · normal-interaction.webm · rapid-interaction.webm ·
 * reduced-motion.webm · touch.webm · keyboard.webm · performance.json
 * Usage: node scripts/signature-evidence.mjs <slug> [--base=URL] [--settle=ms]
 * Per-slug interactions are defined in ACTIONS below.
 */
import { chromium, devices } from "playwright";
import { mkdirSync, renameSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("usage: node scripts/signature-evidence.mjs <slug>"); process.exit(1); }
const arg = (k, d) => { const hit = process.argv.find((a) => a.startsWith(`--${k}=`)); return hit ? hit.split("=").slice(1).join("=") : d; };
const base = arg("base", "http://localhost:3210");
const settle = Number(arg("settle", "2600"));
const dir = join("artifacts", "signature-components", slug);
mkdirSync(dir, { recursive: true });

const STAGE = '[data-stage="main"]';
const DESKTOP = { width: 1280, height: 860 };
const TABLET = { width: 834, height: 1024 };
const MOBILE = { width: 390, height: 760 };

// Primary interaction per signature slug (replay/drag/open…). `rapid` should
// interrupt mid-animation to prove interruption safety.
const ACTIONS = {
  "kinetic-emphasis": {
    normal: async (p) => { await p.getByRole("button", { name: /replay/i }).first().click(); await p.waitForTimeout(2400); },
    rapid: async (p) => {
      const b = p.getByRole("button", { name: /replay/i }).first();
      await b.click(); await p.waitForTimeout(220); await b.click(); await p.waitForTimeout(180);
      await p.getByRole("button", { name: /fast/i }).first().click(); await p.waitForTimeout(1600);
    },
    keyboard: async (p) => {
      // tab to the preview controls and drive them with the keyboard
      for (let i = 0; i < 12; i++) { await p.keyboard.press("Tab"); await p.waitForTimeout(80); }
      await p.keyboard.press("Enter"); await p.waitForTimeout(1800);
    },
    touch: async (p) => { await p.getByRole("button", { name: /replay/i }).first().tap(); await p.waitForTimeout(2400); },
  },
};
const act = ACTIONS[slug] ?? {};

async function el(page) { return (await page.$(STAGE)) ?? page; }
async function open(ctx, theme = "dark", wait = settle) {
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch { /**/ } }, theme);
  await page.goto(`${base}/components/${slug}`, { waitUntil: "networkidle" });
  await page.$(STAGE).then((e) => e?.scrollIntoViewIfNeeded()).catch(() => {});
  await page.waitForTimeout(wait);
  return page;
}

async function still({ browser, name, viewport = DESKTOP, theme = "dark", reduced = false, forcedColors, zoom }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: reduced ? "reduce" : "no-preference", forcedColors });
  const page = await open(ctx, theme, zoom ? 400 : settle);
  if (zoom) { await page.evaluate((z) => { document.body.style.zoom = String(z); }, zoom); await page.waitForTimeout(settle); }
  const t = await el(page);
  await t.screenshot({ path: join(dir, name) });
  await ctx.close();
  console.log("  ✓", name);
}

async function video({ browser, name, viewport = DESKTOP, reduced = false, hasTouch = false, action }) {
  const ctx = await browser.newContext({ viewport, colorScheme: "dark", hasTouch, reducedMotion: reduced ? "reduce" : "no-preference", recordVideo: { dir, size: viewport } });
  const page = await open(ctx, "dark", 600);
  if (action) await action(page).catch((e) => console.warn(`   action: ${e.message}`));
  await page.waitForTimeout(600);
  const vpath = await page.video().path();
  await ctx.close();
  if (existsSync(vpath)) renameSync(vpath, join(dir, name));
  console.log("  ✓", name);
}

/** Frame-rate + long-task profile during the primary interaction. */
async function perf({ browser, throttle = 1 }) {
  const ctx = await browser.newContext({ viewport: DESKTOP, colorScheme: "dark" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch { /**/ } });
  await page.goto(`${base}/components/${slug}`, { waitUntil: "networkidle" });
  await page.$(STAGE).then((e) => e?.scrollIntoViewIfNeeded()).catch(() => {});
  await page.waitForTimeout(settle);
  const metrics = await page.evaluate(async () => {
    const longTasks = [];
    try { new PerformanceObserver((l) => longTasks.push(...l.getEntries().map((e) => e.duration))).observe({ type: "longtask", buffered: true }); } catch { /**/ }
    const frames = [];
    let last = performance.now();
    let running = true;
    const tick = (t) => { frames.push(t - last); last = t; if (running) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    // drive the replay control if present
    const replay = [...document.querySelectorAll("button")].find((b) => /replay/i.test(b.textContent || ""));
    replay?.click();
    await new Promise((r) => setTimeout(r, 2600));
    running = false;
    const valid = frames.filter((f) => f > 0 && f < 250);
    const avg = valid.reduce((a, b) => a + b, 0) / Math.max(1, valid.length);
    const worst = Math.max(...valid, 0);
    const dropped = valid.filter((f) => f > 26).length;
    return { frames: valid.length, avgFrameMs: +avg.toFixed(2), approxFps: +(1000 / avg).toFixed(1), worstFrameMs: +worst.toFixed(1), framesOver26ms: dropped, longTasksMs: longTasks.map((d) => +d.toFixed(1)) };
  });
  await ctx.close();
  return metrics;
}

const browser = await chromium.launch();
try {
  console.log(`[signature-evidence] ${slug} -> ${dir}`);
  await still({ browser, name: "desktop-dark.png" });
  await still({ browser, name: "desktop-light.png", theme: "light" });
  await still({ browser, name: "tablet.png", viewport: TABLET });
  await still({ browser, name: "mobile.png", viewport: MOBILE });
  await still({ browser, name: "forced-colors.png", forcedColors: "active" });
  await still({ browser, name: "zoom-200.png", zoom: 2 });
  await video({ browser, name: "normal-interaction.webm", action: act.normal });
  await video({ browser, name: "rapid-interaction.webm", action: act.rapid });
  await video({ browser, name: "reduced-motion.webm", reduced: true, action: act.normal });
  await video({ browser, name: "touch.webm", viewport: MOBILE, hasTouch: true, action: act.touch });
  await video({ browser, name: "keyboard.webm", action: act.keyboard });
  const desktop = await perf({ browser });
  const throttled = await perf({ browser, throttle: 4 });
  const report = { slug, capturedAt: new Date().toISOString(), desktop, cpuThrottled4x: throttled };
  writeFileSync(join(dir, "performance.json"), JSON.stringify(report, null, 2));
  console.log("  ✓ performance.json", JSON.stringify({ desktopFps: desktop.approxFps, throttledFps: throttled.approxFps }));
} finally {
  await browser.close();
}
console.log(`[signature-evidence] done: ${slug}`);
