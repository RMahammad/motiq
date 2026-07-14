#!/usr/bin/env node
/**
 * Capture signature-component concept comparisons from a /lab/<slug> page.
 * Usage: node scripts/concept-shots.mjs <slug> [--base=http://localhost:3210]
 * Expects sections marked data-concept="A|B|C"; writes concept-{a,b,c}.png
 * (final state) + concept-<x>-mid.png (mid-animation frame) to
 * artifacts/signature-components/<slug>/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/concept-shots.mjs <slug> [--base=URL]");
  process.exit(1);
}
const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3210");
const outDir = join("artifacts", "signature-components", slug);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  try { localStorage.setItem("theme", "dark"); } catch {}
});
await page.goto(`${base}/lab/${slug}`, { waitUntil: "networkidle" });

for (const label of ["A", "B", "C"]) {
  const section = page.locator(`[data-concept="${label}"]`);
  await section.scrollIntoViewIfNeeded();
  // replay to get a deterministic run, catch a mid frame, then the final state
  await section.getByRole("button", { name: /replay/i }).click();
  await page.waitForTimeout(450);
  await section.screenshot({ path: join(outDir, `concept-${label.toLowerCase()}-mid.png`) });
  await page.waitForTimeout(2200);
  await section.screenshot({ path: join(outDir, `concept-${label.toLowerCase()}.png`) });
  console.log(`  ✓ concept-${label.toLowerCase()}`);
}

await browser.close();
console.log(`[concept-shots] done -> ${outDir}`);
