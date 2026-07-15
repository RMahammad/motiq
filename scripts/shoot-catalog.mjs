#!/usr/bin/env node
/**
 * Catalog-page rehabilitation screenshot harness (Playwright + cached chromium).
 * Captures the full /components page across the mandated viewport matrix, plus
 * representative category sections, in dark + light, for before/after evidence.
 *
 * Usage: node scripts/shoot-catalog.mjs [--base=http://localhost:3000] [--prefix=before] [--theme=dark]
 * Writes to artifacts/catalog-rehabilitation/<prefix>/ and .../sections/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3000");
const prefix = arg("prefix", "before");
const settle = Number(arg("settle", "1400"));

const outDir = join("artifacts", "catalog-rehabilitation", prefix);
const secDir = join("artifacts", "catalog-rehabilitation", "sections");
mkdirSync(outDir, { recursive: true });
mkdirSync(secDir, { recursive: true });

const VIEWPORTS = [
  { w: 1920, h: 1080, tag: "1920x1080" },
  { w: 1536, h: 960, tag: "1536x960" },
  { w: 1440, h: 900, tag: "1440x900" },
  { w: 1280, h: 800, tag: "1280x800" },
  { w: 1024, h: 768, tag: "1024x768" },
  { w: 768, h: 1024, tag: "768x1024" },
  { w: 390, h: 844, tag: "390x844" },
];

// Representative category sections (category filter param → label)
const SECTIONS = [
  ["ai", "ai"],
  ["developer-tools", "developer-tools"],
  ["collaboration", "collaboration"],
  ["data-motion", "data"],
  ["mobile", "mobile"],
  ["file", "file"],
  ["commerce", "commerce"],
  ["security", "security"],
  ["communication", "communication"],
  ["productivity", "productivity"],
  ["creative", "creative"],
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
try {
  console.log(`[shoot-catalog] ${prefix} -> ${outDir} (base ${base})`);

  for (const theme of ["dark", "light"]) {
    for (const vp of VIEWPORTS) {
      const { ctx, page } = await newPage(browser, theme, vp);
      await page.goto(`${base}/components`, { waitUntil: "networkidle" });
      await page.waitForTimeout(settle);
      // scroll to bottom to trigger lazy previews, then back to top
      await page.evaluate(async () => {
        const step = () => new Promise((r) => setTimeout(r, 120));
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await step();
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(700);
      const name = `${prefix}-${vp.tag}-${theme}.png`;
      await page.screenshot({ path: join(outDir, name), fullPage: true });
      count++;
      console.log(`  ✓ ${name}`);
      await ctx.close();
    }
  }

  // Category sections at 1440 dark only (representative)
  for (const [cat, label] of SECTIONS) {
    const { ctx, page } = await newPage(browser, "dark", { w: 1440, h: 900 });
    await page.goto(`${base}/components?category=${cat}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(settle);
    await page.evaluate(async () => {
      const step = () => new Promise((r) => setTimeout(r, 100));
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await step();
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    const name = `${prefix}-section-${label}.png`;
    await page.screenshot({ path: join(secDir, name), fullPage: true });
    count++;
    console.log(`  ✓ sections/${name}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`[shoot-catalog] done: ${count} shots`);
