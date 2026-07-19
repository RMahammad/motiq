/**
 * Fictional deployment-run data. Ported from the docs live preview
 * (apps/docs/app/_previews/deployment-pipeline.tsx) so the promo shows the
 * same believable, clearly-fake run the product site shows. No real company,
 * outage, or provider is implied.
 */

export interface PipelineStageBase {
  id: string;
  name: string;
  durationMs: number;
  logs: string[];
}

export const PIPELINE_BASE: PipelineStageBase[] = [
  {
    id: "install",
    name: "Install dependencies",
    durationMs: 8400,
    logs: [
      "$ pnpm install --frozen-lockfile",
      "Lockfile is up to date, resolution step is skipped",
      "Packages: +412",
      "Done in 8.4s",
    ],
  },
  {
    id: "build",
    name: "Build",
    durationMs: 22600,
    logs: [
      "$ next build",
      "  ▲ Next.js 15.1.0",
      " ✓ Compiled successfully",
      " ✓ Generating static pages (24/24)",
    ],
  },
  {
    id: "test",
    name: "Test",
    durationMs: 14200,
    logs: [
      "$ vitest run",
      " ✓ src/lib/format.test.ts (6 tests) 41ms",
      " ❯ src/checkout/session.test.ts (5 tests | 1 failed)",
      "   × creates a session with a valid cart",
      "     → expected 200 but received 500",
      "     at session.test.ts:42:8",
      "Tests  1 failed | 78 passed (79)",
    ],
  },
  {
    id: "deploy",
    name: "Deploy to production",
    durationMs: 11800,
    logs: [
      "$ deploy --env production",
      "Uploading build output ...",
      "Warming edge cache in 3 regions",
      "Deployment ready → https://app.example.com",
    ],
  },
];

export const PIPELINE_WINDOW_TITLE = "deploy · commit a1f3c9d";
export const PIPELINE_WINDOW_META = "main → production";
