// Renders the Motiq campaign to assets/campaign/:
//   readme        motiq-readme-hero.gif  (1200×675 source → 15 fps GIF loop, target < 8 MB)
//   landscape     deployment-pipeline-spotlight.mp4 (H.264, upscaled to 1920×1080)
//   square-agent  agent-workflow-spotlight.mp4      (H.264 1080×1080)
//   square-data   live-data-spotlight.mp4           (H.264 1080×1080)
//   vertical      motiq-social-vertical.mp4         (H.264 1080×1920)
//   reduced       motiq-reduced-motion.mp4          (H.264 1200×675)
//   poster        motiq-poster.png                  (2400×1350 via --scale=2)
//   showcase      assets/showcase/: composite PNG + animated mosaic + 4 card GIFs
//
// Usage: node scripts/render-campaign.mjs [target …]   (no args = everything)
// Requires ffmpeg on PATH for the GIF palette encode.
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appDir, "..", "..");
const outDir = join(repoRoot, "assets", "campaign");
const tmpDir = join(appDir, "out");
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const render = (id, out, extra = []) =>
  execFileSync(
    "npx",
    ["remotion", "render", "src/index.ts", id, out, "--codec=h264", "--crf=16", "--log=error", ...extra],
    { cwd: appDir, stdio: "inherit" },
  );

const report = (file) => {
  const mb = (statSync(file).size / 1024 / 1024).toFixed(2);
  console.log(`✔ ${file} (${mb} MB)`);
  return Number(mb);
};

const gifEncode = (mp4, gif, { fps = 15, width = 1080, dither = "sierra2_4a" } = {}) => {
  const filter =
    `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];` +
    "[s0]palettegen=max_colors=200:stats_mode=diff[p];" +
    `[s1][p]paletteuse=dither=${dither}:diff_mode=rectangle`;
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp4, "-vf", filter, "-loop", "0", gif],
    { stdio: "inherit" },
  );
};

/** Lossy LZW re-optimization — roughly 40% smaller. No-op if gifsicle is absent. */
const gifOptimize = (gif) => {
  try {
    execFileSync("gifsicle", ["-O3", "--lossy=60", gif, "-o", gif], { stdio: "inherit" });
  } catch {
    console.log("… gifsicle not found, skipping lossy optimization (brew install gifsicle)");
  }
};

const targets = {
  /** README hero: 2K master MP4 (CRF 18) + 1440×810 GIF loop + 2K poster PNG. */
  readme() {
    const master = join(outDir, "motiq-readme-hero-2k.mp4");
    const gif = join(outDir, "motiq-readme-hero.gif");
    const poster = join(outDir, "motiq-readme-poster.png");
    console.log("▶ MotiqReadmeHero 2K master …");
    execFileSync(
      "npx",
      ["remotion", "render", "src/index.ts", "MotiqReadmeHero", master, "--codec=h264", "--crf=18", "--log=error"],
      { cwd: appDir, stdio: "inherit" },
    );
    report(master);
    console.log("▶ README GIF (1440×810, 15 fps, loop) …");
    // Bayer (ordered) dither: stable between frames on the dark gradients, so
    // the frame-diff encoding stays small; gifsicle then re-compresses lossily.
    gifEncode(master, gif, { fps: 15, width: 1440, dither: "bayer:bayer_scale=5" });
    gifOptimize(gif);
    const mb = report(gif);
    if (mb >= 10) {
      console.log(`⚠ GIF is ${mb} MB — consider max_colors/fps reduction before shipping.`);
    }
    console.log("▶ README poster (2560×1440, hero hold frame) …");
    execFileSync(
      "npx",
      ["remotion", "still", "src/index.ts", "MotiqReadmeHero", poster, "--frame=40", "--log=error"],
      { cwd: appDir, stdio: "inherit" },
    );
    report(poster);
  },
  landscape() {
    const out = join(outDir, "deployment-pipeline-spotlight.mp4");
    console.log("▶ DeploymentPipelineSpotlight (1920×1080) …");
    render("DeploymentPipelineSpotlight", out, ["--width=1920", "--height=1080"]);
    report(out);
  },
  "square-agent"() {
    const out = join(outDir, "agent-workflow-spotlight.mp4");
    console.log("▶ AgentWorkflowSpotlight …");
    render("AgentWorkflowSpotlight", out);
    report(out);
  },
  "square-data"() {
    const out = join(outDir, "live-data-spotlight.mp4");
    console.log("▶ LiveDataSpotlight …");
    render("LiveDataSpotlight", out);
    report(out);
  },
  vertical() {
    const out = join(outDir, "motiq-social-vertical.mp4");
    console.log("▶ MotiqSocialVertical …");
    render("MotiqSocialVertical", out);
    report(out);
  },
  reduced() {
    const out = join(outDir, "motiq-reduced-motion.mp4");
    console.log("▶ MotiqReducedMotionDemo …");
    render("MotiqReducedMotionDemo", out);
    report(out);
  },
  poster() {
    const out = join(outDir, "motiq-poster.png");
    console.log("▶ MotiqPoster (2400×1350) …");
    execFileSync(
      "npx",
      ["remotion", "still", "src/index.ts", "MotiqPoster", out, "--scale=2", "--log=error"],
      { cwd: appDir, stdio: "inherit" },
    );
    report(out);
  },
  /**
   * README showcase mosaic → assets/showcase/:
   *   motiq-showcase.png        1600×1000 static composite (mosaic @ posterFrame)
   *   motiq-showcase-loop.gif   1200-wide animated mosaic (one shared 6 s loop)
   *   showcase-<workflow>.gif   800-wide per-card workflow loops ×4
   */
  showcase() {
    const showcaseDir = join(repoRoot, "assets", "showcase");
    mkdirSync(showcaseDir, { recursive: true });
    // posterFrame in src/showcase.ts — every card's hold has begun by here.
    const POSTER_FRAME = 168;

    const poster = join(showcaseDir, "motiq-showcase.png");
    console.log("▶ Showcase composite (1600×1000) …");
    execFileSync(
      "npx",
      [
        "remotion",
        "still",
        "src/index.ts",
        "MotiqShowcaseMosaic",
        poster,
        `--frame=${POSTER_FRAME}`,
        "--log=error",
      ],
      { cwd: appDir, stdio: "inherit" },
    );
    report(poster);

    const cards = [
      ["ShowcaseAiInterfaceCard", "showcase-ai-interface"],
      ["ShowcaseDeveloperToolsCard", "showcase-developer-tools"],
      ["ShowcaseDataMotionCard", "showcase-data-motion"],
      ["ShowcaseCollaborationCard", "showcase-collaboration"],
    ];
    for (const [id, name] of cards) {
      const mp4 = join(tmpDir, `${name}.mp4`);
      const gif = join(showcaseDir, `${name}.gif`);
      console.log(`▶ ${id} …`);
      render(id, mp4);
      gifEncode(mp4, gif, { fps: 15, width: 800, dither: "bayer:bayer_scale=5" });
      gifOptimize(gif);
      report(gif);
    }

    const mosaicMp4 = join(tmpDir, "motiq-showcase-loop.mp4");
    const mosaicGif = join(showcaseDir, "motiq-showcase-loop.gif");
    console.log("▶ MotiqShowcaseMosaic loop …");
    render("MotiqShowcaseMosaic", mosaicMp4);
    gifEncode(mosaicMp4, mosaicGif, { fps: 15, width: 1200, dither: "bayer:bayer_scale=5" });
    gifOptimize(mosaicGif);
    report(mosaicGif);
  },
};

const requested = process.argv.slice(2);
const list = requested.length > 0 ? requested : Object.keys(targets);
for (const name of list) {
  const fn = targets[name];
  if (!fn) {
    console.error(`Unknown target "${name}". Available: ${Object.keys(targets).join(", ")}`);
    process.exit(1);
  }
  fn();
}
console.log(`\nCampaign assets written to ${outDir}`);
