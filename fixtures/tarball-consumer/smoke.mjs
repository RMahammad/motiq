// Smoke test for the PACKED artifacts (installed from tarballs, not workspace source).
// Verifies: (1) @scope/react resolves via its exports map, (2) "use client" survived into the
// installed file, (3) the whole react->motion->tokens chain resolves from tarballs and SSR-renders.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Reveal, AnimatedButton, PricingCard, AnimatedDialog } from "@scope/react";

let failed = false;
function check(ok, msg) {
  console.log(`${ok ? "OK  " : "FAIL"}  ${msg}`);
  if (!ok) failed = true;
}

// 1) resolves through the exports map to the installed dist file
const entry = fileURLToPath(import.meta.resolve("@scope/react"));
check(entry.includes("node_modules") && entry.endsWith(".js"), `@scope/react resolves to installed dist: ${entry.split("node_modules/").pop()}`);

// 2) "use client" preserved in the installed artifact
const src = readFileSync(entry, "utf8");
check(src.trimStart().startsWith('"use client"'), `"use client" preserved in installed @scope/react`);

// 3) cross-package chain SSR-renders from the tarballs
const html = renderToString(createElement(Reveal, { trigger: "mount", direction: "up" }, "hello from tarball"));
check(html.includes("scope-reveal") && html.includes("hello from tarball") && html.includes('data-motion="shown"'), `Reveal SSR renders from tarball: ${html.slice(0, 90)}…`);

const btnHtml = renderToString(createElement(AnimatedButton, { type: "button" }, "Go"));
check(btnHtml.includes("scope-btn") && btnHtml.includes("Go"), `AnimatedButton (react->motion->tokens) SSR renders`);

// PricingCard (paid component) SSR-renders from the tarball
const priceHtml = renderToString(
  createElement(PricingCard, { planName: "Pro", price: "$29", features: ["A"], cta: { label: "Buy", href: "/x" } }),
);
check(priceHtml.includes("scope-pricing-card") && priceHtml.includes("$29"), `PricingCard SSR renders from tarball`);

// AnimatedDialog resolves (pulls @radix-ui/react-dialog transitively) and SSRs the trigger
check(typeof AnimatedDialog === "function", `AnimatedDialog resolves (with @radix-ui/react-dialog)`);
const dlgHtml = renderToString(
  createElement(AnimatedDialog, { title: "T", trigger: createElement("button", { type: "button" }, "Open") }),
);
check(dlgHtml.includes("Open"), `AnimatedDialog SSR renders its trigger`);

process.exit(failed ? 1 : 0);
