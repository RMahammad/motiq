#!/usr/bin/env node
/** Capture the hero showcase frame on mobile widths, AI + Task-map tabs. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3210";
const outDir = join("artifacts", "hero-rebuild", "showcase");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const w of [390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: "light" });
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem("theme", "light"); } catch {} });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const frame = page.locator("[data-hero-frame]");
    await frame.scrollIntoViewIfNeeded();
    const tabs = await page.$$('[role="tab"]');
    for (const i of [0, 2]) {
      await tabs[i].click();
      await page.waitForTimeout(600);
      const label = (await tabs[i].innerText()).replace(/\s+/g, "-").toLowerCase();
      await frame.screenshot({ path: join(outDir, `showcase-m${w}-${label}.png`) });
      console.log("  ✓", `showcase-m${w}-${label}.png`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
