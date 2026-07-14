#!/usr/bin/env node
/**
 * Persistent component screenshot harness (Playwright + cached chromium).
 * Usage: node scripts/shoot.mjs <slug> [--base=http://localhost:3210] [--prefix=after]
 * Writes to artifacts/component-reviews/<slug>/.
 * Captures: <prefix>-desktop-dark/light, <prefix>-mobile-dark/light, focus, reduced-motion,
 * and per-slug interaction states.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/shoot.mjs <slug> [--base=URL] [--prefix=after]");
  process.exit(1);
}
const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3210");
const prefix = arg("prefix", "after");
const settle = Number(arg("settle", "1100")); // ms to let entrance animations finish
const outDir = join("artifacts", "component-reviews", slug);
mkdirSync(outDir, { recursive: true });

const DESKTOP = { width: 1280, height: 860 };
const MOBILE = { width: 390, height: 760 };
const STAGE = '[data-stage="main"]';

// per-slug interaction: (page) => Promise, plus a label
const INTERACTIONS = {
  "animated-dialog": [{ label: "open", full: true, run: async (p) => { await p.getByRole("button", { name: /^invite$/i }).first().click(); await p.waitForTimeout(600); } }],
  "animated-tabs": [{ label: "analytics", run: async (p) => { await p.getByRole("tab", { name: /analytics/i }).first().click(); await p.waitForTimeout(600); } }],
  "animated-accordion": [{ label: "expanded", run: async (p) => { await p.getByRole("button", { name: /reduced motion/i }).first().click(); await p.waitForTimeout(500); } }],
  "animated-button": [{ label: "loading", run: async (p) => { await p.getByRole("button", { name: /^publish$/i }).first().click(); await p.waitForTimeout(350); } }],
  "animated-list": [{ label: "added", run: async (p) => { await p.getByRole("button", { name: /^add$/i }).first().click(); await p.waitForTimeout(700); } }],
  "animated-icons": [{ label: "copied", run: async (p) => { await p.getByRole("button", { name: /copy key/i }).first().click(); await p.waitForTimeout(500); } }],
};

// per-slug focus action → a REAL :focus-visible state inside the stage
// (the default double-Tab lands on page chrome for some layouts, producing a
// screenshot identical to the default state — invalid evidence).
const FOCUS = {
  "kinetic-emphasis": async (p) => {
    for (let i = 0; i < 25; i++) {
      await p.keyboard.press("Tab");
      const done = await p.evaluate(() => {
        const el = document.activeElement;
        return !!el && /replay/i.test(el.textContent || "") && !!el.closest('[data-stage="main"]');
      });
      if (done) break;
    }
    await p.waitForTimeout(250);
  },
};

async function target(page) {
  const el = await page.$(STAGE);
  return el ?? page;
}

async function shoot({ browser, theme, viewport, name, reduced = false, action, full = false }) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: theme,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    try { localStorage.setItem("theme", t); } catch { /* ignore */ }
  }, theme);
  await page.goto(`${base}/components/${slug}`, { waitUntil: "networkidle" });
  // scroll the stage into view so in-view animations fire, then settle
  await page.$(STAGE).then((el) => el?.scrollIntoViewIfNeeded()).catch(() => {});
  await page.waitForTimeout(settle);
  if (action) await action(page).catch((e) => console.warn(`  action failed: ${e.message}`));
  const t = full ? page : await target(page);
  await t.screenshot({ path: join(outDir, name) });
  await ctx.close();
  console.log(`  ✓ ${name}`);
}

const browser = await chromium.launch();
try {
  console.log(`[shoot] ${slug} -> ${outDir}`);
  await shoot({ browser, theme: "dark", viewport: DESKTOP, name: `${prefix}-desktop-dark.png` });
  await shoot({ browser, theme: "light", viewport: DESKTOP, name: `${prefix}-desktop-light.png` });
  await shoot({ browser, theme: "dark", viewport: MOBILE, name: `${prefix}-mobile-dark.png` });
  await shoot({ browser, theme: "light", viewport: MOBILE, name: `${prefix}-mobile-light.png` });
  await shoot({ browser, theme: "dark", viewport: DESKTOP, name: "reduced-motion.png", reduced: true });
  await shoot({
    browser, theme: "dark", viewport: DESKTOP, name: "focus.png",
    action: FOCUS[slug] ?? (async (p) => { await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(200); }),
  });
  for (const it of INTERACTIONS[slug] ?? []) {
    await shoot({ browser, theme: "dark", viewport: DESKTOP, name: `interaction-${it.label}.png`, action: it.run, full: it.full });
  }
} finally {
  await browser.close();
}
console.log(`[shoot] done: ${slug}`);
