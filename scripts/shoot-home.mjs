#!/usr/bin/env node
/**
 * Homepage art-direction screenshot harness.
 * Usage: node scripts/shoot-home.mjs [--base=URL] [--brand=editorial|aurora|warm|none] [--out=dir] [--prefix=name]
 * Captures full-page + section crops (hero, featured, packs, cta) at light + dark.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3000");
const brand = arg("brand", "none");
const prefix = arg("prefix", brand);
const outDir = arg("out", join("artifacts", "homepage-redesign", "directions"));
mkdirSync(outDir, { recursive: true });

const VIEW = { width: 1440, height: 940 };

const SECTIONS = [
  { name: "hero", sel: "section:nth-of-type(1)" },
  { name: "featured", h2: /Featured components/i },
  { name: "categories", h2: /Built for real workflows/i },
  { name: "packs", h2: /Complete workflow packs/i },
  { name: "cta", h2: /Ship product motion today/i },
];

async function shoot(browser, theme) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, colorScheme: theme });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    try { localStorage.setItem("theme", t); } catch {}
  }, theme);
  await page.goto(base, { waitUntil: "networkidle" });
  // Set attributes AFTER hydration so Next's client render can't drop them.
  await page.evaluate(([t, b]) => {
    document.documentElement.setAttribute("data-theme", t);
    if (b && b !== "none") document.documentElement.setAttribute("data-brand", b);
    else document.documentElement.removeAttribute("data-brand");
  }, [theme, brand]);
  await page.waitForTimeout(1400);

  const tag = `${prefix}-${theme}`;
  await page.screenshot({ path: join(outDir, `${tag}-full.png`), fullPage: true });

  for (const s of SECTIONS) {
    try {
      let el;
      if (s.h2) {
        const h = page.getByRole("heading", { name: s.h2 }).first();
        el = h.locator("xpath=ancestor::section[1]");
      } else {
        el = page.locator(s.sel).first();
      }
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await el.screenshot({ path: join(outDir, `${tag}-${s.name}.png`) });
    } catch (e) {
      console.warn(`  ${tag}/${s.name}: ${e.message}`);
    }
  }
  await ctx.close();
  console.log(`✓ ${tag}`);
}

const browser = await chromium.launch();
for (const theme of ["dark", "light"]) await shoot(browser, theme);
await browser.close();
console.log(`done → ${outDir}`);
