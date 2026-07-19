// Renders the social promotion kit to assets/promo/:
//   motiq-trailer.mp4   16:9 1280x720  ~32s  (X/LinkedIn native video upload)
//   motiq-square.mp4/.gif  1:1 1080x1080 12s loop (feeds)
//   motiq-vertical.mp4  9:16 1080x1920 12s (Shorts/Reels/TikTok)
//   motiq-card.png      1200x675 static (X image posts / link cards)
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(toolDir, "..", "..");
const outDir = join(repoRoot, "assets", "promo");
mkdirSync(outDir, { recursive: true });

const render = (id, out, extra = []) =>
  execFileSync(
    "npx",
    ["remotion", "render", "src/index.ts", id, out, "--codec=h264", "--crf=17", "--log=error", ...extra],
    { cwd: toolDir, stdio: "inherit" },
  );

const report = (file) =>
  console.log(`✔ ${file} (${(statSync(file).size / 1024 / 1024).toFixed(2)} MB)`);

console.log("▶ Rendering trailer …");
const trailer = join(outDir, "motiq-trailer.mp4");
render("motiq-trailer", trailer);
report(trailer);

console.log("▶ Rendering square loop …");
const squareMp4 = join(outDir, "motiq-square.mp4");
render("motiq-square", squareMp4);
report(squareMp4);

const squareGif = join(outDir, "motiq-square.gif");
execFileSync(
  "ffmpeg",
  [
    "-y", "-loglevel", "error", "-i", squareMp4,
    "-vf",
    "fps=20,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=220:stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle",
    "-loop", "0", squareGif,
  ],
  { stdio: "inherit" },
);
report(squareGif);

console.log("▶ Rendering vertical …");
const vertical = join(outDir, "motiq-vertical.mp4");
render("motiq-vertical", vertical);
report(vertical);

console.log("▶ Rendering static card …");
const card = join(outDir, "motiq-card.png");
execFileSync(
  "npx",
  ["remotion", "still", "src/index.ts", "motiq-card", card, "--frame=150", "--log=error"],
  { cwd: toolDir, stdio: "inherit" },
);
report(card);

console.log("\nSocial kit written to assets/promo/");
