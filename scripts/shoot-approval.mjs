import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
const base = "http://localhost:3000";
const out = join("artifacts", "approval-history");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2, colorScheme: theme });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
  await page.goto(`${base}/components/approval-workflow`, { waitUntil: "networkidle" });
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.waitForTimeout(900);
  // expand every "Decision history" disclosure inside the main stage
  await page.evaluate(() => {
    document.querySelectorAll("button").forEach((b) => {
      if (/Decision history/i.test(b.textContent || "") && b.getAttribute("aria-expanded") !== "true") b.click();
    });
  });
  await page.waitForTimeout(700);
  // screenshot the first approval-workflow section (the main interactive preview)
  const region = page.locator('section[aria-label^="Approval workflow"]').first();
  await region.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await region.screenshot({ path: join(out, `${theme}.png`) });
  console.log(`✓ ${theme}`);
  await ctx.close();
}
await browser.close();
console.log(`done → ${out}`);
