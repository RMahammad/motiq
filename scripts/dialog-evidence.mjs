#!/usr/bin/env node
/** Signature dialog evidence → artifacts/component-reviews/animated-dialog/audit/. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3210";
const url = `${base}/components/animated-dialog`;
const dir = join("artifacts", "component-reviews", "animated-dialog", "audit");
const framesDir = join(dir, "frames");
mkdirSync(framesDir, { recursive: true });

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 390, height: 780 };

async function open(page, name) {
  await page.getByRole("button", { name: new RegExp(`^${name}$`, "i") }).first().click();
  await page.waitForTimeout(550);
}

async function shot({ browser, name, theme = "dark", viewport = DESKTOP, reduced = false, forcedColors, zoom, trigger = "Invite", after }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: reduced ? "reduce" : "no-preference", forcedColors });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch { /**/ } }, theme);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.$('[data-stage="main"]').then((e) => e?.scrollIntoViewIfNeeded()).catch(() => {});
  if (zoom) await page.evaluate((z) => { document.body.style.zoom = String(z); }, zoom);
  await page.waitForTimeout(400);
  await open(page, trigger);
  if (after) await after(page).catch(() => {});
  await page.screenshot({ path: join(dir, name) });
  await ctx.close();
  console.log("  ✓", name);
}

const browser = await chromium.launch();
try {
  console.log("[dialog-evidence]");
  await shot({ browser, name: "sig-desktop-centered.png" });
  await shot({ browser, name: "sig-desktop-light.png", theme: "light" });
  await shot({ browser, name: "sig-mobile-sheet.png", viewport: MOBILE });
  await shot({ browser, name: "sig-mobile-sheet-light.png", viewport: MOBILE, theme: "light" });
  await shot({ browser, name: "sig-long-content.png", trigger: "Edit" });
  await shot({ browser, name: "sig-long-content-mobile.png", trigger: "Edit", viewport: MOBILE });
  await shot({ browser, name: "sig-destructive.png", trigger: "Delete" });
  await shot({ browser, name: "sig-loading.png", trigger: "Delete", after: async (p) => { await p.getByRole("button", { name: /delete workspace/i }).click(); await p.waitForTimeout(300); } });
  await shot({ browser, name: "sig-forced-colors.png", forcedColors: "active" });
  await shot({ browser, name: "sig-zoom-200.png", zoom: 2 });
  await shot({ browser, name: "sig-reduced-motion.png", reduced: true });
  // GENUINE localization pressure: open the long form, then inject ~40% longer
  // German labels/title/actions into the live dialog to prove wrapping + the
  // flex-wrap footer hold (distinct render, not a copy of the long-content shot).
  await shot({
    browser,
    name: "sig-localization.png",
    trigger: "Edit",
    after: async (p) => {
      await p.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]');
        if (!dlg) return;
        const labels = ["Vollständiger Anzeigename", "Eindeutiger Benutzername", "E-Mail-Adresse", "Unternehmensbezeichnung", "Standortbezeichnung", "Webseiten-Adresse (URL)", "Persönliche Biografie"];
        dlg.querySelectorAll("label").forEach((el, i) => { if (labels[i]) el.textContent = labels[i]; });
        const h = dlg.querySelector("h2"); if (h) h.textContent = "Profilinformationen bearbeiten";
        dlg.querySelectorAll("button").forEach((b) => {
          const t = (b.textContent || "").toLowerCase();
          if (t.includes("save")) b.textContent = "Änderungen dauerhaft speichern";
          else if (t.includes("cancel")) b.textContent = "Abbrechen und schließen";
        });
      });
      await p.waitForTimeout(200);
    },
  });

  // entrance frame sequence of the centered open
  const ctx = await browser.newContext({ viewport: DESKTOP, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch { /**/ } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^invite$/i }).first().click();
  const times = [40, 110, 200, 340];
  let prev = 0;
  for (const t of times) { await page.waitForTimeout(t - prev); prev = t; await page.screenshot({ path: join(framesDir, `sig-open-${String(t).padStart(4, "0")}ms.png`) }); }
  await ctx.close();
  console.log("  ✓ frames/sig-open-*");
} finally {
  await browser.close();
}
console.log("[dialog-evidence] done");
