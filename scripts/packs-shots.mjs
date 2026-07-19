#!/usr/bin/env node
/**
 * Capture full-page + viewport screenshots of /packs across themes and widths.
 * Usage: node scripts/packs-shots.mjs <phase> [--base=http://localhost:3210]
 *   phase = "before" | "after"
 * Writes to artifacts/packs-rebuild/<phase>/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const phase = process.argv[2] || "after";
const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3210");
const outDir = join("artifacts", "packs-rebuild", phase);
mkdirSync(outDir, { recursive: true });

const widths = [
  { name: "1920", w: 1920, h: 1080 },
  { name: "1440", w: 1440, h: 900 },
  { name: "1280", w: 1280, h: 800 },
  { name: "1024", w: 1024, h: 768 },
  { name: "768", w: 768, h: 1024 },
  { name: "430", w: 430, h: 932 },
  { name: "390", w: 390, h: 844 },
  { name: "320", w: 320, h: 720 },
];

const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  for (const vp of widths) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
      colorScheme: theme,
    });
    const page = await ctx.newPage();
    await page.addInitScript((t) => {
      try { localStorage.setItem("theme", t); } catch {}
    }, theme);
    await page.goto(`${base}/packs`, { waitUntil: "networkidle" });
    // let lazy previews mount + settle
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    const full = ["1440", "390"].includes(vp.name);
    await page.screenshot({
      path: join(outDir, `${theme}-${vp.name}${full ? "-full" : ""}.png`),
      fullPage: full,
    });
    console.log(`  ✓ ${theme}-${vp.name}`);
    await ctx.close();
  }
}

await browser.close();
console.log(`[packs-shots] done -> ${outDir}`);
