/**
 * README showcase mosaic — timing, copy, and formats.
 *
 * Five-card grid: a typography-led stats card plus four workflow previews
 * built from the real registry components (AI Interface, Developer Tools,
 * Data Motion, Collaboration). All four workflow loops share ONE duration so
 * the animated mosaic loops as a single piece and every per-card GIF restarts
 * from a clean, fully-settled hold.
 *
 * Claim discipline: "56+" matches the README/LAUNCH.md count (47
 * registry:component + 9 registry:ui items in packages/registry/registry.json).
 */

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

export const cardPhases = {
  /** composer types → submit (loading) → run + tools + approval → stream → hold. */
  agent: buildPhases({ enter: 8, prompt: 20, submitted: 8, workspace: 60, stream: 48, hold: 36 }),
  /** install → build → test → FAIL → logs → focus Retry → retry run → deploy → hold. */
  pipeline: buildPhases({
    enter: 8,
    install: 12,
    build: 14,
    test: 12,
    fail: 6,
    logs: 22,
    focus: 10,
    retryRun: 20,
    deploy: 16,
    hold: 60,
  }),
  /** stable snapshot → refresh (KPIs morph, rows cascade) → settled hold. */
  data: buildPhases({ enter: 8, stable: 30, refresh: 70, hold: 72 }),
  /** presence joins → comment lands → approval flips → settle → hold. */
  collab: buildPhases({ enter: 8, presence: 30, comment: 40, approve: 40, settle: 10, hold: 52 }),
} as const;

/** One shared loop length (frames @30fps) — the mosaic loops as one piece. */
export const cardDuration = cardPhases.agent.duration;
for (const [name, p] of Object.entries(cardPhases)) {
  if (p.duration !== cardDuration) {
    throw new Error(
      `showcase card "${name}" loop is ${p.duration} frames; every card must be ${cardDuration}`,
    );
  }
}

const A = cardPhases.agent.at;
const P = cardPhases.pipeline.at;
const D = cardPhases.data.at;
const C = cardPhases.collab.at;

/** Adapter beat maps (local frames), derived from the phases — never hand-set. */
export const cardInner = {
  agent: {
    beats: {
      promptStart: A.prompt,
      promptSubmit: A.submitted,
      runStart: A.workspace + 6,
      toolMetricsDone: A.workspace + 20,
      toolDeploysDone: A.workspace + 34,
      approvalAsk: A.workspace + 34,
      approvalOk: A.workspace + 50,
      streamStart: A.stream + 4,
      streamEnd: A.stream + 44,
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
  data: { refreshStart: D.refresh, refreshEnd: D.refresh + 64 },
  collab: { join: C.presence + 6, comment: C.comment + 6, approve: C.approve + 6 },
} as const;

/**
 * Composite frame: deep inside every card's hold phase, so the poster shows
 * each workflow at its finished state (streamed answer with citations, green
 * pipeline, settled KPIs, granted approval). Latest hold starts at frame 144.
 */
export const posterFrame = 168;

/** Card copy. Labels are category names; subs read as tiny workflow synopses. */
export const showcaseCopy = {
  stats: {
    count: 56,
    countSuffix: "+",
    title: "Animated React components",
    subtitle: "For real product workflows.",
    line: "AI · Deployments · Live data · Collaboration",
    meta: "Free & open source · MIT · shadcn registry",
  },
  ai: { label: "AI Interface", sub: "prompt → tools → cited answer" },
  pipeline: { label: "Developer Tools", sub: "fail → inspect → retry → ship" },
  data: { label: "Data Motion", sub: "refresh → morph → settle" },
  collab: {
    label: "Collaboration",
    sub: "presence → comment → approval",
    /** The narrow mosaic card omits the comment thread — and the long sub. */
    subShort: "presence → approval",
  },
} as const;

/** Output formats. The mosaic is designed at 1600×1000 and rendered 1:1. */
export const showcaseFormats = {
  mosaic: {
    id: "MotiqShowcaseMosaic",
    width: 1600,
    height: 1000,
    fps: 30,
    durationInFrames: cardDuration,
  },
  aiCard: {
    id: "ShowcaseAiInterfaceCard",
    width: 1200,
    height: 750,
    fps: 30,
    durationInFrames: cardDuration,
  },
  pipelineCard: {
    id: "ShowcaseDeveloperToolsCard",
    width: 1200,
    height: 750,
    fps: 30,
    durationInFrames: cardDuration,
  },
  dataCard: {
    id: "ShowcaseDataMotionCard",
    width: 1200,
    height: 750,
    fps: 30,
    durationInFrames: cardDuration,
  },
  collabCard: {
    id: "ShowcaseCollaborationCard",
    width: 1200,
    height: 750,
    fps: 30,
    durationInFrames: cardDuration,
  },
} as const;
