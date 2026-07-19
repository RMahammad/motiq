#!/usr/bin/env node
/**
 * Audit-evidence harness: motion recordings (webm) + frame sequences + missing
 * states (tablet, 200% zoom, forced-colors, empty/loading) for the independent
 * audit. Writes to artifacts/component-reviews/<slug>/audit/.
 * Usage: node scripts/audit-evidence.mjs <slug> [--base=http://localhost:3210]
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("usage: node scripts/audit-evidence.mjs <slug>"); process.exit(1); }
const base = (process.argv.find((a) => a.startsWith("--base=")) || "--base=http://localhost:3210").split("=")[1];
const dir = join("artifacts", "component-reviews", slug, "audit");
const framesDir = join(dir, "frames");
mkdirSync(framesDir, { recursive: true });

const STAGE = '[data-stage="main"]';
const DESKTOP = { width: 1280, height: 860 };
const TABLET = { width: 834, height: 1024 };
const MOBILE = { width: 390, height: 760 };

// primary click interaction per slug (full=screenshot whole page for portals)
const CLICK = {
  "animated-dialog": { full: true, run: async (p) => { await p.getByRole("button", { name: /^invite$/i }).first().click(); await p.waitForTimeout(500); } },
  "animated-tabs": { run: async (p) => { await p.getByRole("tab", { name: /analytics/i }).first().click(); await p.waitForTimeout(400); } },
  "animated-accordion": { run: async (p) => { await p.getByRole("button", { name: /reduced motion/i }).first().click(); await p.waitForTimeout(400); } },
  "animated-button": { run: async (p) => { await p.getByRole("button", { name: /^publish$/i }).first().click(); await p.waitForTimeout(300); } },
  "animated-list": { run: async (p) => { await p.getByRole("button", { name: /^add$/i }).first().click(); await p.waitForTimeout(500); } },
  "animated-icons": { run: async (p) => { await p.getByRole("button", { name: /copy key/i }).first().click(); await p.waitForTimeout(400); } },
};
const INTERACTIVE = new Set(Object.keys(CLICK));

async function el(page) { return (await page.$(STAGE)) ?? page; }

async function still({ browser, name, viewport = DESKTOP, theme = "dark", reduced = false, forcedColors, zoom, action, full }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: reduced ? "reduce" : "no-preference", forcedColors });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch { /**/ } }, theme);
  await page.goto(`${base}/components/${slug}`, { waitUntil: "networkidle" });
  await page.$(STAGE).then((e) => e?.scrollIntoViewIfNeeded()).catch(() => {});
  if (zoom) await page.evaluate((z) => { document.body.style.zoom = String(z); }, zoom);
  await page.waitForTimeout(1100);
  if (action) await action(page).catch((e) => console.warn(`   action: ${e.message}`));
  const t = full ? page : await el(page);
  await t.screenshot({ path: join(dir, name) });
  await ctx.close();
  console.log("  ✓", name);
}

async function frames({ browser }) {
  const ctx = await browser.newContext({ viewport: DESKTOP, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch { /**/ } });
  await page.goto(`${base}/components/${slug}`, { waitUntil: "domcontentloaded" });
  await page.$(STAGE).then((e) => e?.scrollIntoViewIfNeeded()).catch(() => {});
  const times = [80, 220, 400, 650, 1000];
  let prev = 0;
  for (const t of times) { await page.waitForTimeout(t - prev); prev = t; const e = await el(page); await e.screenshot({ path: join(framesDir, `entrance-${String(t).padStart(4, "0")}ms.png`) }); }
  await ctx.close();
  console.log("  ✓ frames/entrance-*");
}

async function video({ browser, name, viewport = DESKTOP, reduced = false, action, doubleTap = false }) {
  const ctx = await browser.newContext({ viewport, colorScheme: "dark", reducedMotion: reduced ? "reduce" : "no-preference", recordVideo: { dir, size: viewport } });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch { /**/ } });
  await page.goto(`${base}/components/${slug}`, { waitUntil: "networkidle" });
  await page.$(STAGE).then((e) => e?.scrollIntoViewIfNeeded()).catch(() => {});
  await page.waitForTimeout(500);
  if (action) { await action(page).catch(() => {}); if (doubleTap) { await page.waitForTimeout(150); await action(page).catch(() => {}); } }
  await page.waitForTimeout(900);
  const vpath = await page.video().path();
  await ctx.close();
  if (existsSync(vpath)) renameSync(vpath, join(dir, name));
  console.log("  ✓", name);
}

const browser = await chromium.launch();
try {
  console.log(`[audit] ${slug} -> ${dir}`);
  // missing-state stills
  await still({ browser, name: "tablet-dark.png", viewport: TABLET });
  await still({ browser, name: "tablet-light.png", viewport: TABLET, theme: "light" });
  await still({ browser, name: "zoom-200.png", zoom: 2 });
  await still({ browser, name: "forced-colors.png", forcedColors: "active", theme: "dark" });
  // motion evidence
  await frames({ browser });
  const click = CLICK[slug];
  await video({ browser, name: "normal-interaction.webm", action: click?.run });
  await video({ browser, name: "reduced-motion.webm", reduced: true, action: click?.run });
  await video({ browser, name: "mobile.webm", viewport: MOBILE, action: click?.run });
  if (INTERACTIVE.has(slug)) {
    await video({ browser, name: "rapid-toggle.webm", action: click?.run, doubleTap: true });
    await video({ browser, name: "keyboard.webm", action: async (p) => { await p.keyboard.press("Tab"); await p.keyboard.press("Enter"); await p.waitForTimeout(300); } });
  }
  // per-slug extra states
  if (slug === "animated-list") {
    await still({ browser, name: "state-empty.png", action: async (p) => { for (let i = 0; i < 3; i++) { await p.getByRole("button", { name: /dismiss/i }).first().click().catch(() => {}); await p.waitForTimeout(300); } } });
  }
  if (slug === "animated-button") {
    await still({ browser, name: "state-loading.png", action: click.run });
  }
} finally {
  await browser.close();
}
console.log(`[audit] done: ${slug}`);
