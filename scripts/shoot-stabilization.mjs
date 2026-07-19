#!/usr/bin/env node
/**
 * Product UI stabilization capture (docs/56). Homepage + Components at the full
 * viewport matrix, plus representative detail/block pages + high-risk components
 * at desktop/mobile/320. Also records max horizontal-overflow per page.
 *
 * Usage: node scripts/shoot-stabilization.mjs [--base=http://localhost:3210] [--prefix=before] [--theme=dark]
 */
import { chromium } from "playwright";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=").slice(1).join("=") : d;
};
const base = arg("base", "http://localhost:3210");
const prefix = arg("prefix", "before");
const theme = arg("theme", "dark");
const settle = Number(arg("settle", "1400"));

const outDir = join("artifacts", "product-ui-stabilization", prefix);
mkdirSync(outDir, { recursive: true });
const overflowLog = join(outDir, "_overflow.txt");
writeFileSync(overflowLog, `# horizontal overflow report (${prefix}, ${theme})\n`);

const VIEWPORTS = [
  { w: 1920, h: 1080 }, { w: 1536, h: 960 }, { w: 1440, h: 900 }, { w: 1280, h: 800 },
  { w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 430, h: 932 }, { w: 390, h: 844 },
  { w: 375, h: 812 }, { w: 320, h: 700 },
];

// full-matrix pages
const MATRIX = [["/", "home"], ["/components", "catalog"]];
// detail/block pages at a reduced matrix
const DETAIL_VPS = [{ w: 1440, h: 900 }, { w: 390, h: 844 }, { w: 320, h: 700 }];
const DETAIL = [
  ["/components/task-dependency-map", "detail-task-dependency-map"],
  ["/components/project-timeline", "detail-project-timeline"],
  ["/components/kanban-card-movement", "detail-kanban"],
  ["/components/api-request-inspector", "detail-api-inspector"],
  ["/components/streaming-data-rows", "detail-streaming-rows"],
  ["/components/ai-response-stream", "detail-ai-stream"],
  ["/components/comment-thread", "detail-comment-thread"],
  ["/components/session-security-center", "detail-session-security"],
  ["/components/checkout-progress", "detail-checkout"],
  ["/components/mobile-filter-sheet", "detail-mobile-filter"],
  ["/packs/ai-interface", "pack-ai"],
  ["/components/ai-agent-workspace", "block-ai-workspace"],
  ["/components/live-operations-dashboard", "block-live-ops"],
];

async function cap(browser, url, name, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch { /* noop */ } }, theme);
  await page.goto(`${base}${url}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(settle);
  await page.evaluate(async () => {
    const step = () => new Promise((r) => setTimeout(r, 110));
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) { window.scrollTo(0, y); await step(); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  const of = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  if (of.sw > of.iw + 1) appendFileSync(overflowLog, `OVERFLOW ${name} @${vp.w}: scrollWidth ${of.sw} > ${of.iw}\n`);
  await page.screenshot({ path: join(outDir, `${prefix}-${name}-${vp.w}-${theme}.png`), fullPage: true });
  await ctx.close();
  console.log(`  ✓ ${name} @${vp.w}${of.sw > of.iw + 1 ? " [OVERFLOW]" : ""}`);
}

const browser = await chromium.launch();
try {
  console.log(`[shoot-stabilization] ${prefix} (${theme}) -> ${outDir}`);
  for (const [url, name] of MATRIX) for (const vp of VIEWPORTS) await cap(browser, url, name, vp);
  for (const [url, name] of DETAIL) for (const vp of DETAIL_VPS) await cap(browser, url, name, vp);
} finally {
  await browser.close();
}
console.log("[shoot-stabilization] done");
