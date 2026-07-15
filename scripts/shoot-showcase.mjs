#!/usr/bin/env node
/** Capture the hero showcase frame per tab (all four components) in light + dark. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3210";
const outDir = join("artifacts", "hero-rebuild", "showcase");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
    const page = await ctx.newPage();
    await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const frame = page.locator("[data-hero-frame]");
    await frame.scrollIntoViewIfNeeded();
    const tabs = await page.$$('[role="tab"]');
    for (let i = 0; i < tabs.length; i++) {
      await tabs[i].click();
      await page.waitForTimeout(700);
      const label = (await tabs[i].innerText()).replace(/\s+/g, "-").toLowerCase();
      const name = `showcase-${theme}-${i}-${label}.png`;
      await frame.screenshot({ path: join(outDir, name) });
      console.log("  ✓", name);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
