import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
const base = "http://localhost:3000";
const out = join("artifacts", "repro");
mkdirSync(out, { recursive: true });
const STAGE = '[data-stage="main"]';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch {} });

// --- KPI ---
await page.goto(`${base}/components/kpi-number-morph`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.$(STAGE).then((el) => el?.scrollIntoViewIfNeeded());
await page.$(STAGE).then((el) => el?.screenshot({ path: join(out, "kpi-detail.png") }));
console.log("✓ kpi-detail");

// --- Tabs transition frames ---
await page.goto(`${base}/components/animated-tabs`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const stage = await page.$(STAGE);
await stage?.scrollIntoViewIfNeeded();
await stage?.screenshot({ path: join(out, "tabs-0-overview.png") });
// click Analytics and grab frames mid-transition
const analytics = page.getByRole("tab", { name: /analytics/i }).first();
await analytics.click();
for (const [i, ms] of [40, 90, 150, 260].entries()) {
  await page.waitForTimeout(i === 0 ? ms : ms - [40, 90, 150, 260][i - 1]);
  await stage?.screenshot({ path: join(out, `tabs-t${ms}.png`) });
}
await page.waitForTimeout(400);
await stage?.screenshot({ path: join(out, "tabs-1-analytics.png") });
// switch to reports (tallest) then back to overview (shortest) to exaggerate the jump
await page.getByRole("tab", { name: /reports/i }).first().click();
await page.waitForTimeout(120);
await stage?.screenshot({ path: join(out, "tabs-reports-mid.png") });
console.log("✓ tabs frames");
await browser.close();
console.log(`done → ${out}`);
