#!/usr/bin/env node
/**
 * Keeps the code shown on /guides/live-data identical to the real, typechecked code
 * in examples.tsx.
 *
 * A page can only render strings, and a string copy of a component's API is exactly
 * how documentation goes quietly wrong — a prop gets renamed, the component and its
 * tests are updated, and the guide keeps teaching the old name. Here the snippets are
 * generated from examples.tsx, which is typechecked like any other source file, so a
 * renamed prop breaks the build.
 *
 *   node scripts/sync-guide-examples.mjs           # regenerate the page's constants
 *   node scripts/sync-guide-examples.mjs --check   # fail if they are out of date (CI)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDE = path.join(root, "apps/docs/app/guides/live-data/page.tsx");
const EXAMPLES = path.join(root, "apps/docs/app/guides/live-data/examples.tsx");

/** region id in examples.tsx → the `const NAME = \`…\`` it fills on the page */
const REGIONS = { streaming: "STREAMING", subscription: "SUBSCRIPTION", polling: "POLLING" };

const check = process.argv.includes("--check");
const examples = readFileSync(EXAMPLES, "utf8");
let guide = readFileSync(GUIDE, "utf8");
const stale = [];

for (const [region, constName] of Object.entries(REGIONS)) {
  const m = new RegExp(`// #region ${region}\\n([\\s\\S]*?)\\n// #endregion`).exec(examples);
  if (!m) throw new Error(`examples.tsx: no "#region ${region}" block`);

  // "use client" belongs at the top of the real file; each snippet needs its own,
  // since a consumer pastes one snippet, not the whole file.
  const body = `"use client";\n\nimport * as React from "react";\n${importsFor(region)}\n\n${m[1].trim()}`;

  // Escape only what a template literal cares about.
  const literal = body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const target = new RegExp(`(const ${constName} = \`)[\\s\\S]*?(\`;)`);
  if (!target.test(guide)) throw new Error(`page.tsx: no \`const ${constName} = …\` to fill`);

  const current = target.exec(guide)[0];
  const replacement = `const ${constName} = \`${literal}\`;`;
  if (current !== replacement) {
    stale.push(constName);
    guide = guide.replace(target, () => replacement);
  }
}

/** The import line a reader needs for that snippet alone. */
function importsFor(region) {
  const imports = {
    streaming:
      'import { AiResponseStream, type ResponseSegment, type StreamState } from "@/components/motiq/ai-response-stream";',
    subscription:
      'import { LiveLogStream, type LogEntry, type LogStreamStatus } from "@/components/motiq/live-log-stream";',
    polling: 'import { DataRefreshState, type RefreshState } from "@/components/motiq/data-refresh-state";',
  };
  return imports[region];
}

if (!stale.length) {
  console.log("sync-guide-examples: OK — the guide matches examples.tsx.");
  process.exit(0);
}

if (check) {
  console.error(
    `❌ sync-guide-examples: ${stale.join(", ")} on /guides/live-data no longer match examples.tsx.\n` +
      `   Run \`node scripts/sync-guide-examples.mjs\` and commit the result.\n`,
  );
  process.exit(1);
}

writeFileSync(GUIDE, guide);
console.log(`sync-guide-examples: updated ${stale.join(", ")} from examples.tsx.`);
