#!/usr/bin/env node
/**
 * Homepage-hero rebuild screenshot harness (Playwright + cached chromium).
 * Captures the hero region of the homepage across the mandated viewport matrix
 * in dark + light, for before/after evidence of the hero rebuild (docs/60 rework).
 *
 * Usage: node scripts/shoot-hero.mjs [--base=http://localhost:3210] [--prefix=before] [--settle=1400]
 * Writes to artifacts/hero-rebuild/<prefix>/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3210");
const prefix = arg("prefix", "before");
const settle = Number(arg("settle", "1400"));

const outDir = join("artifacts", "hero-rebuild", prefix);
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { w: 1920, h: 1080, tag: "1920" },
  { w: 1440, h: 900, tag: "1440" },
  { w: 1280, h: 800, tag: "1280" },
  { w: 1024, h: 768, tag: "1024" },
  { w: 768, h: 1024, tag: "768" },
  { w: 430, h: 932, tag: "430" },
  { w: 390, h: 844, tag: "390" },
  { w: 320, h: 720, tag: "320" },
];

async function newPage(browser, theme, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    try { localStorage.setItem("theme", t); } catch { /* ignore */ }
  }, theme);
  return { ctx, page };
}

const browser = await chromium.launch();
let count = 0;
const overflow = [];
try {
  console.log(`[shoot-hero] ${prefix} -> ${outDir} (base ${base})`);
  for (const theme of ["dark", "light"]) {
    for (const vp of VIEWPORTS) {
      const { ctx, page } = await newPage(browser, theme, vp);
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForTimeout(settle);
      // Capture the hero region: from the top through the showcase + proof row.
      // Clip generously; the hero is the top ~1.6 viewports.
      const clipH = Math.min(Math.round(vp.h * 2.0), 2200);
      const name = `${prefix}-${vp.tag}-${theme}.png`;
      await page.screenshot({
        path: join(outDir, name),
        clip: { x: 0, y: 0, width: vp.w, height: clipH },
      });
      // Horizontal-overflow probe (body must not scroll sideways).
      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      if (hasOverflow) overflow.push(`${vp.tag}-${theme}`);
      count++;
      console.log(`  ✓ ${name}${hasOverflow ? "  ⚠ H-OVERFLOW" : ""}`);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
console.log(`[shoot-hero] done: ${count} shots`);
console.log(overflow.length ? `[shoot-hero] ⚠ overflow at: ${overflow.join(", ")}` : "[shoot-hero] ✓ no horizontal overflow");
