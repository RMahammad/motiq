// Deterministic-frame test: renders the same mid-composition frame twice per
// composition and asserts identical pixel hashes (same props -> same frames).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(toolDir, "out", "determinism");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const cases = [
  ["motiq-intro", 90],
  ["motiq-install", 200],
  ["motiq-showcase", 120],
  ["motiq-pillars", 100],
  ["motiq-free", 110],
  ["motiq-cat-product-backgrounds", 130],
  ["motiq-cat-ai", 130],
  ["motiq-cat-commerce", 130],
];

let failed = false;
for (const [id, frame] of cases) {
  const hashes = [];
  for (const run of [1, 2]) {
    const png = join(tmp, `${id}-${run}.png`);
    execFileSync(
      "npx",
      ["remotion", "still", "src/index.ts", id, png, `--frame=${frame}`, "--log=error"],
      { cwd: toolDir, stdio: "inherit" },
    );
    hashes.push(createHash("sha256").update(readFileSync(png)).digest("hex"));
  }
  const ok = hashes[0] === hashes[1];
  if (!ok) failed = true;
  console.log(`${ok ? "✔" : "✘"} ${id} frame ${frame}: ${ok ? "deterministic" : "HASH MISMATCH"}`);
}

process.exit(failed ? 1 : 0);
