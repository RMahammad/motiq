/**
 * Central campaign configuration — every composition reads copy, claims,
 * timing, sizes, and safe areas from here so the material stays consistent
 * across landscape, square, and vertical outputs.
 *
 * Claim discipline: every number below is verified against the repo.
 * - "56 animated React components" = 47 `registry:component` + 9 `registry:ui`
 *   items in packages/registry/registry.json (LAUNCH.md fact sheet agrees).
 * - "4 complete workflow packs" = ai-interface-pack, developer-tools-pack,
 *   collaboration-pack, data-motion-pack.
 * - Install command matches apps/docs/lib/product.ts (`npx shadcn@latest add
 *   <registryBaseUrl>/<item>`), registryBaseUrl from product.config.json.
 */

export const brand = {
  name: "Motiq",
  domain: "motiq.dev",
  github: "github.com/RMahammad/motiq",
  tagline: "Product interfaces that feel alive.",
} as const;

export const claims = {
  components: "56 animated React components",
  packs: "4 complete workflow packs",
  source: "Installed as editable source",
  license: "Free and open source.",
  licenseSub: "MIT · no signup · shadcn-compatible registry",
} as const;

export const installCommand = "npx shadcn@latest add https://motiq.dev/r/ai-response-stream";
export const installCommandPipeline = "npx shadcn@latest add https://motiq.dev/r/deployment-pipeline";

/** Real pack names from packages/registry/registry.json. */
export const packs = {
  ai: "AI Interface Pack",
  developerTools: "Developer Tools Pack",
  collaboration: "Collaboration Pack",
  dataMotion: "Data Motion Pack",
} as const;

/* -------------------------------------------------------------------------- */
/* MotiqReadmeHero phase system (v3).                                          */
/*                                                                             */
/* Every scene is an ORDERED record of phase durations; boundaries and the     */
/* scene duration are derived, never hardcoded, so an exit frame can never     */
/* land before a component's final state. The next scene starts during the     */
/* outgoing exit phase, overlapping its last `heroOverlap` frames.             */
/* The hero renders on a 1280×720 logical stage scaled ×2 to 2560×1440.       */
/* -------------------------------------------------------------------------- */

/** Ordered phase durations → absolute start-of-phase boundaries + total. */
const buildPhases = <T extends Record<string, number>>(defs: T) => {
  const at = {} as { [K in keyof T]: number };
  let acc = 0;
  for (const k of Object.keys(defs) as (keyof T)[]) {
    at[k] = acc;
    acc += defs[k];
  }
  return { at, duration: acc, defs };
};

/** Frames the incoming scene overlaps the outgoing scene's exit phase. */
export const heroOverlap = 6;

export const heroPhases = {
  /** Lockup already on screen at frame 0 (loop handoff): hold → exit. */
  hero: buildPhases({ hold: 42, exit: 12 }),
  /** enter → prompt types → submitted (loading) → run+tools+approval → stream → hold ≥24 → exit. */
  agent: buildPhases({ enter: 12, prompt: 18, submitted: 8, workspace: 54, stream: 42, hold: 24, exit: 12 }),
  /** enter → install → build → test → fail → logs hold ≥18 → focus → retry run → deploy → success hold ≥24 → exit. */
  pipeline: buildPhases({ enter: 12, install: 12, build: 14, test: 14, fail: 6, logs: 24, focus: 12, retryRun: 20, deploy: 16, hold: 24, exit: 12 }),
  /** enter → stable → refresh (all values settle inside) → settled hold ≥24 → exit. */
  data: buildPhases({ enter: 12, stable: 12, refresh: 44, hold: 24, exit: 12 }),
  /** enter → presence joins → comment lands → approval flips → settle → hold ≥24 → exit. */
  collab: buildPhases({ enter: 12, presence: 12, comment: 14, approve: 8, settle: 6, hold: 24, exit: 12 }),
  /** claims stagger → install types → assembled card hold ≥30 → copy out → lockup returns → loop hold. */
  outro: buildPhases({ enter: 8, claims: 24, install: 18, assembled: 36, copyOut: 12, lockupIn: 12, lockupHold: 18 }),
} as const;

const HERO_ORDER = ["hero", "agent", "pipeline", "data", "collab", "outro"] as const;

/** Absolute scene windows, chained with the exit overlap. */
export const heroSpans = (() => {
  const spans = {} as Record<
    (typeof HERO_ORDER)[number],
    { from: number; duration: number; to: number }
  >;
  let from = 0;
  for (const key of HERO_ORDER) {
    const duration = heroPhases[key].duration;
    spans[key] = { from, duration, to: from + duration };
    from += duration - heroOverlap;
  }
  return spans;
})();

export const heroDuration = heroSpans.outro.to;

/** In-scene state beats, local to each scene's Sequence, derived from phases. */
const A = heroPhases.agent.at;
const P = heroPhases.pipeline.at;
const D = heroPhases.data.at;
const C = heroPhases.collab.at;

export const heroInner = {
  agent: {
    beats: {
      promptStart: A.prompt,
      promptSubmit: A.submitted,
      runStart: A.workspace + 6,
      toolMetricsDone: A.workspace + 18,
      toolDeploysDone: A.workspace + 30,
      approvalAsk: A.workspace + 30,
      approvalOk: A.workspace + 44,
      streamStart: A.stream + 6,
      streamEnd: A.stream + 40,
    },
    workspaceAt: A.workspace,
    streamAt: A.stream,
  },
  pipeline: {
    installDone: P.build,
    buildDone: P.test,
    testFail: P.fail,
    logsOpen: P.logs,
    retryFocus: P.focus,
    retryGo: P.retryRun,
    testPass: P.deploy,
    deployDone: P.hold - 2,
  },
  data: { refreshStart: D.refresh, refreshEnd: D.refresh + 40 },
  collab: { join: C.presence + 2, comment: C.comment + 2, approve: C.approve },
} as const;

export type LayoutKind = "landscape" | "square" | "vertical";

/** Output formats. All source compositions are 30 fps. */
export const formats = {
  readme: { id: "MotiqReadmeHero", width: 2560, height: 1440, fps: 30, durationInFrames: heroDuration },
  pipeline: { id: "DeploymentPipelineSpotlight", width: 1200, height: 675, fps: 30, durationInFrames: 240 },
  agent: { id: "AgentWorkflowSpotlight", width: 1080, height: 1080, fps: 30, durationInFrames: 285 },
  data: { id: "LiveDataSpotlight", width: 1080, height: 1080, fps: 30, durationInFrames: 210 },
  vertical: { id: "MotiqSocialVertical", width: 1080, height: 1920, fps: 30, durationInFrames: 300 },
  reduced: { id: "MotiqReducedMotionDemo", width: 1200, height: 675, fps: 30, durationInFrames: 210 },
  poster: { id: "MotiqPoster", width: 1200, height: 675, fps: 30 },
} as const;

/** Safe text margins (px) per layout — keeps copy clear of platform chrome. */
export const safeArea: Record<LayoutKind, { x: number; top: number; bottom: number }> = {
  landscape: { x: 64, top: 48, bottom: 48 },
  square: { x: 64, top: 72, bottom: 72 },
  vertical: { x: 72, top: 220, bottom: 260 },
};

/** README-hero scene headings — exactly one on screen at a time. */
export const heroHeadings = {
  agent: { pack: packs.ai, heading: "Follow every agent action." },
  pipeline: { pack: packs.developerTools, heading: "Make deployment state understandable." },
  data: { pack: packs.dataMotion, heading: "Show exactly what changed." },
  collab: { pack: packs.collaboration, heading: "Keep decisions visible." },
} as const;

/** Copy per scene — one primary headline at a time. */
export const copy = {
  agent: {
    kicker: packs.ai,
    headline: "See what the agent is doing.",
    support: "Tools, approvals, streaming, and citations.",
    closing: "Build the workflow. Own the source.",
  },
  pipeline: {
    kicker: packs.developerTools,
    headline: "Real product states.",
    support: "Editable React source.",
  },
  data: {
    kicker: packs.dataMotion,
    headline: "Motion that explains what changed.",
  },
  collab: {
    kicker: packs.collaboration,
    headline: "Presence, comments, approvals.",
  },
  vertical: {
    headline: "Animated React components for real product workflows.",
    support: "Installed as editable source.",
  },
  reduced: {
    kicker: "prefers-reduced-motion: reduce",
    headline: "Every state still communicated.",
  },
} as const;
