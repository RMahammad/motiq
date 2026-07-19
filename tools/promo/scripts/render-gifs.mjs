// Renders every promo composition to MP4, then converts to a looping GIF via
// ffmpeg's two-pass palette pipeline (much better color than a direct GIF encode).
// Output: assets/promo/<id>.gif at the repo root.
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(toolDir, "..", "..");
const outDir = join(toolDir, "out");
const gifDir = join(repoRoot, "assets", "promo");
mkdirSync(outDir, { recursive: true });
mkdirSync(gifDir, { recursive: true });

const compositions = [
  "motiq-intro",
  "motiq-install",
  "motiq-showcase",
  "motiq-pillars",
  "motiq-free",
  "motiq-cat-product-backgrounds",
  "motiq-cat-workflow-heroes",
  "motiq-cat-ai",
  "motiq-cat-developer-tools",
  "motiq-cat-collaboration",
  "motiq-cat-data-motion",
  "motiq-cat-productivity",
  "motiq-cat-file-workflows",
  "motiq-cat-commerce",
  "motiq-cat-security",
  "motiq-cat-communication",
];

const only = process.argv.slice(2);
const targets = only.length > 0 ? compositions.filter((c) => only.includes(c)) : compositions;

for (const id of targets) {
  const mp4 = join(outDir, `${id}.mp4`);
  const gif = join(gifDir, `${id}.gif`);

  console.log(`\n▶ Rendering ${id} …`);
  execFileSync(
    "npx",
    ["remotion", "render", "src/index.ts", id, mp4, "--codec=h264", "--crf=15", "--log=error"],
    { cwd: toolDir, stdio: "inherit" },
  );

  console.log(`▶ Encoding GIF ${id} …`);
  const filter =
    "fps=20,scale=960:-1:flags=lanczos,split[s0][s1];" +
    "[s0]palettegen=max_colors=220:stats_mode=diff[p];" +
    "[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp4, "-vf", filter, "-loop", "0", gif],
    { stdio: "inherit" },
  );

  const mb = (statSync(gif).size / 1024 / 1024).toFixed(2);
  console.log(`✔ ${gif} (${mb} MB)`);
}

console.log("\nAll GIFs written to assets/promo/");
