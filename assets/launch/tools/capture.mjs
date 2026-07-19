// Capture looping demo videos of Motiq previews with Playwright, for GIF/MP4 conversion.
import { createRequire } from "module";
import { mkdirSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

const require = createRequire("/Users/mahammadrustamov/Desktop/remotion-library/package.json");
const { chromium } = require("playwright");

const BASE = "http://localhost:3000/components/";
const OUT = process.argv[2] || "/private/tmp/claude-501/-Users-mahammadrustamov-Desktop-remotion-library/dc437483-f277-47cb-a296-55d119bbcc01/scratchpad/captures";
mkdirSync(OUT, { recursive: true });

const VIEW = { width: 1600, height: 1300 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Per-target choreography. Each returns to its initial visual state so the GIF loops seamlessly.
const TARGETS = [
  {
    slug: "ai-response-stream",
    // Auto-streams on mount. Wait for completion during setup, then: hold complete
    // 0.8s -> restart -> stream to complete -> hold 1.6s. Seam: complete -> complete.
    run: async (page, api) => {
      await api.waitUntil(page, () => {
        const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Stop");
        return b && b.disabled;
      }, 30000);
      await sleep(400);
      const t0 = await api.mark();
      await sleep(800);
      await api.click(page, "Start stream", "Restart");
      await api.waitUntil(page, () => {
        const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Stop");
        return b && b.disabled;
      }, 30000);
      await sleep(1600);
      return t0;
    },
  },
  {
    slug: "kpi-number-morph",
    // 4 snapshots cycle: 4 clicks returns to snapshot 0. Seam: s0 -> s0.
    run: async (page, api) => {
      const t0 = await api.mark();
      await sleep(1000);
      for (let k = 0; k < 4; k++) {
        await api.click(page, "Simulate update");
        await sleep(2200);
      }
      await sleep(600);
      return t0;
    },
  },
  {
    slug: "deployment-pipeline",
    // Demo mounts settled on a Test failure. Setup: retry to reach all-passed.
    // Loop: passed (hold) -> inject failure -> halts at Test -> retry -> passed (hold).
    run: async (page, api) => {
      const has = (s) => `document.querySelector("#preview").textContent.includes(${JSON.stringify(s)})`;
      await api.waitUntil(page, has("Halted at Test"), 30000);
      await api.click(page, "Retry Test", "Retry");
      await api.waitUntil(page, has("All stages passed"), 30000);
      await sleep(500);
      const t0 = await api.mark();
      await sleep(1000);
      await api.click(page, "Inject test failure");
      await api.waitUntil(page, has("Halted at Test"), 30000);
      await sleep(1400);
      await api.click(page, "Retry Test", "Retry");
      await api.waitUntil(page, has("All stages passed"), 30000);
      await sleep(1700);
      return t0;
    },
  },
  {
    slug: "live-presence-stack",
    // Starts with 4 users; join/leave choreography nets back to the same 4. Seam clean.
    run: async (page, api) => {
      const t0 = await api.mark();
      await sleep(900);
      const seq = ["Join", "Join", "Leave", "Join", "Leave", "Leave"];
      for (const label of seq) {
        await api.click(page, label);
        await sleep(1500);
      }
      await sleep(500);
      return t0;
    },
  },
  {
    slug: "live-log-stream",
    // Continuous scripted feed (1200ms cadence); record a stretch, cut between appends.
    run: async (page, api) => {
      const t0 = await api.mark();
      await sleep(12000);
      return t0;
    },
  },
];

let CURRENT = { page: null, sel: null };
const api = {
  // Freeze the stage at its settled height so later state changes can't shrink it
  // and pull unrelated page content into the crop band.
  mark: async () => {
    const { page, sel } = CURRENT;
    await page.evaluate((s) => {
      const inner = document.querySelector(s).firstElementChild.firstElementChild;
      inner.style.minHeight = inner.getBoundingClientRect().height + "px";
      inner.scrollIntoView({ block: "center", behavior: "instant" });
    }, sel);
    return Date.now();
  },
  click: async (page, ...labels) => {
    const ok = await page.evaluate((lbls) => {
      const btns = [...document.querySelectorAll("#preview button")];
      for (const l of lbls) {
        const b = btns.find((x) => x.textContent.trim().includes(l) && !x.disabled);
        if (b) { b.click(); return l; }
      }
      return null;
    }, labels);
    if (!ok) throw new Error(`no clickable button among: ${labels.join(", ")}`);
  },
  waitUntil: async (page, fn, timeout) => {
    await page.waitForFunction(fn, null, { timeout });
  },
};

const only = process.argv.slice(3);
const browser = await chromium.launch();
let report = {};
try { report = JSON.parse((await import("fs")).readFileSync(join(OUT, "report.json"), "utf8")); } catch {}

for (const t of TARGETS) {
  if (only.length && !only.includes(t.slug)) continue;
  const ctx = await browser.newContext({
    viewport: VIEW,
    colorScheme: "dark",
    recordVideo: { dir: OUT, size: VIEW },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const tCtx = Date.now();
  await page.goto(BASE + t.slug, { waitUntil: "networkidle" });
  const stageSel = `#${t.slug}-panel-preview`;
  CURRENT = { page, sel: stageSel };
  await page.waitForSelector(stageSel);
  await page.evaluate(() => document.fonts.ready);

  // Hide demo control bars (buttons stay JS-clickable) and center the stage.
  await page.evaluate((sel) => {
    const stage = document.querySelector(sel);
    // Demo control bars are flex-wrap bg-secondary rows sitting as direct children of
    // the preview's max-w wrapper. Component internals (e.g. the pipeline's console
    // card) also use bg-secondary + buttons, so scope tightly.
    for (const w of stage.querySelectorAll('[class*="max-w-"]')) {
      for (const c of w.children) {
        const cls = String(c.className);
        if (cls.includes("flex-wrap") && cls.includes("bg-[var(--color-bg-secondary)]") && c.querySelector("button")) {
          c.style.display = "none";
        }
        if (c.tagName === "P" && c.textContent.includes("Demo data")) c.style.display = "none";
      }
      for (const el of w.querySelectorAll("p,div,span")) {
        const t = el.textContent.trim();
        if (t.length < 80 && /Demo data|Demo stream|fictional|no live model|illustrative/i.test(t)) {
          el.style.display = "none";
        }
      }
    }
    stage.scrollIntoView({ block: "center", behavior: "instant" });
  }, stageSel);
  await sleep(300);

  // Track the union bounding box of visible stage content over the whole recording,
  // so growing content (streams, expanding panels) never escapes the crop.
  const sampler = setInterval(() => {
    page.evaluate((sel) => {
      const stage = document.querySelector(sel);
      if (!stage) return;
      const box = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
      // Preview modules constrain themselves with max-w-* wrappers; union those to hug
      // the component instead of the full-width centering rows around it.
      const inner = stage.firstElementChild?.firstElementChild ?? stage;
      const cands = [...inner.querySelectorAll('[class*="max-w-"]')];
      const add = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 40 && r.height > 20) {
          box.l = Math.min(box.l, r.left); box.t = Math.min(box.t, r.top);
          box.r = Math.max(box.r, r.right); box.b = Math.max(box.b, r.bottom);
        }
      };
      if (cands.length) cands.forEach(add);
      else for (const c of inner.children) {
        const cs = getComputedStyle(c);
        if (cs.position !== "absolute" && cs.display !== "none") add(c);
      }
      const w = window;
      w.__cropUnion = w.__cropUnion || { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
      const u = w.__cropUnion;
      u.l = Math.min(u.l, box.l); u.t = Math.min(u.t, box.t);
      u.r = Math.max(u.r, box.r); u.b = Math.max(u.b, box.b);
    }, stageSel).catch(() => {});
  }, 400);

  let t0;
  try {
    t0 = await t.run(page, api);
  } finally {
    clearInterval(sampler);
  }
  const tEnd = Date.now();
  const union = await page.evaluate(() => window.__cropUnion);
  const stageRect = await page.evaluate((s) => {
    const inner = document.querySelector(s).firstElementChild.firstElementChild;
    return inner.getBoundingClientRect().toJSON();
  }, stageSel);
  union.l = Math.max(union.l, stageRect.left); union.t = Math.max(union.t, stageRect.top);
  union.r = Math.min(union.r, stageRect.right); union.b = Math.min(union.b, stageRect.bottom);
  const video = page.video();
  await ctx.close();
  const raw = await video.path();
  const dest = join(OUT, `${t.slug}.webm`);
  renameSync(raw, dest);

  const PAD = 26;
  // Pad around the content, but never past the stage surface (avoids slivers of
  // the docs page leaking in at the edges).
  const L = Math.max(0, Math.max(union.l - PAD, stageRect.left + 2));
  const T = Math.max(0, Math.max(union.t - PAD, stageRect.top + 2));
  const R = Math.min(VIEW.width, Math.min(union.r + PAD, stageRect.right - 2));
  const B = Math.min(VIEW.height, Math.min(union.b + PAD, stageRect.bottom - 2));
  const crop = { x: Math.floor(L), y: Math.floor(T), w: Math.ceil(R - L) & ~1, h: Math.ceil(B - T) & ~1 };
  report[t.slug] = { crop, trimStart: (t0 - tCtx) / 1000, duration: (tEnd - t0) / 1000 };
  console.log(t.slug, JSON.stringify(report[t.slug]));
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
}

await browser.close();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("done");
