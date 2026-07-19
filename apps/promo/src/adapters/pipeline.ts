import type { Stage, StageStatus } from "@/registry/developer-tools/deployment-pipeline";

import { PIPELINE_BASE } from "../data/pipeline";

/**
 * Frame → DeploymentPipeline props. The component is display-only (the app
 * owns `stages`), so the whole story is a pure function of the frame.
 */
export interface PipelineBeats {
  /** Install stage flips to passed; Build starts running. Omit = already passed. */
  installDone?: number;
  /** Build stage flips to passed; Test starts running. */
  buildDone: number;
  /** Test flips to failed, Deploy is cancelled. */
  testFail: number;
  /** Log panel for the failed Test stage is revealed. */
  logsOpen: number;
  /** Keyboard focus lands on the Retry button. */
  retryFocus: number;
  /** Retry activates: Test back to running, Deploy back to queued. */
  retryGo: number;
  /** Test passes on the retry (optional — spotlight only). */
  testPass?: number;
  /** Deploy completes (optional — spotlight only). */
  deployDone?: number;
}

export interface PipelineFrameState {
  stages: Stage[];
  /** Remount key — changing it re-seeds `defaultExpandedId`. */
  panelKey: string;
  expandedId?: string;
  /** True while the Retry button should hold real keyboard focus. */
  focusRetry: boolean;
}

const TEST_INDEX = 2;

export function pipelineAt(frame: number, b: PipelineBeats): PipelineFrameState {
  const failed = frame >= b.testFail && frame < b.retryGo;
  const retried = frame >= b.retryGo;
  const testPassed = b.testPass !== undefined && frame >= b.testPass;
  const deployDone = b.deployDone !== undefined && frame >= b.deployDone;

  const installDone = b.installDone ?? Number.NEGATIVE_INFINITY;

  const statusFor = (i: number): StageStatus => {
    if (i === 0) return frame >= installDone ? "passed" : "running";
    if (i === 1) {
      if (frame < installDone) return "queued";
      return frame >= b.buildDone ? "passed" : "running";
    }
    if (i === TEST_INDEX) {
      if (frame < b.buildDone) return "queued";
      if (failed) return "failed";
      if (retried) return testPassed ? "passed" : "running";
      return "running";
    }
    // deploy
    if (failed) return "cancelled";
    if (testPassed) return deployDone ? "passed" : "running";
    return "queued";
  };

  const stages: Stage[] = PIPELINE_BASE.map((base, i) => {
    const status = statusFor(i);
    return {
      id: base.id,
      name: base.name,
      status,
      durationMs:
        status === "passed" || status === "failed" ? base.durationMs : undefined,
      logs: status === "queued" || status === "cancelled" ? undefined : base.logs,
    };
  });

  const expanded = frame >= b.logsOpen && failed;
  return {
    stages,
    // Remounts at each expansion change so `defaultExpandedId` re-seeds.
    panelKey: expanded ? "logs-open" : retried ? "retried" : "run",
    expandedId: expanded ? "test" : undefined,
    focusRetry: failed && frame >= b.retryFocus,
  };
}
