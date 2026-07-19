import type { AgentRun, RunStep, StepStatus } from "@/registry/ai/agent-run-timeline";
import type { ToolCall } from "@/registry/ai/tool-call-activity";
import type { ResponseSegment, StreamState } from "@/registry/ai/ai-response-stream";
import type { ComposerStatus } from "@/registry/ai/prompt-composer";

import {
  AGENT_PROMPT,
  AGENT_RUN_TITLE,
  RESPONSE_TEXT_A,
  RESPONSE_TEXT_B,
  RESPONSE_TEXT_C,
  TOOL_META,
} from "../data/agent";
import { ramp } from "../theme/anim";

/** Beat map (local frames) for the agent workflow. */
export interface AgentBeats {
  /** Composer typing window. */
  promptStart: number;
  promptSubmit: number;
  /** Run begins (timeline visible, first steps resolve). */
  runStart: number;
  toolMetricsDone: number;
  toolDeploysDone: number;
  /** Approval requested → granted. */
  approvalAsk: number;
  approvalOk: number;
  /** Streaming window for the response. */
  streamStart: number;
  streamEnd: number;
}

export interface AgentFrameState {
  composerValue: string;
  composerStatus: ComposerStatus;
  run: AgentRun;
  calls: ToolCall[];
  segments: ResponseSegment[];
  streamState: StreamState;
  /** Word-count progress 0–1, useful for scene choreography. */
  streamProgress: number;
}

/** Reveal `text` word-by-word; whole words only so nothing shimmers. */
const sliceWords = (text: string, fraction: number): string => {
  if (fraction >= 1) return text;
  if (fraction <= 0) return "";
  const words = text.split(" ");
  return words.slice(0, Math.round(words.length * fraction)).join(" ");
};

export function agentAt(frame: number, b: AgentBeats): AgentFrameState {
  // --- composer ---
  const typedEnd = Math.max(b.promptStart + 1, b.promptSubmit - 4);
  const typed = sliceWords(AGENT_PROMPT, ramp(frame, b.promptStart, typedEnd));
  const composerStatus: ComposerStatus =
    frame < b.promptSubmit ? "idle" : frame < b.streamStart ? "loading" : "streaming";

  // --- run timeline ---
  const stepStatus = (start: number, end: number): StepStatus =>
    frame < start ? "pending" : frame < end ? "active" : "completed";

  const approvalStatus: StepStatus =
    frame < b.approvalAsk
      ? "pending"
      : frame < b.approvalOk
        ? "waiting_approval"
        : "completed";

  const steps: RunStep[] = [
    {
      id: "plan",
      title: "Parse request and plan",
      status: frame < b.runStart ? "active" : "completed",
      durationMs: 300,
    },
    {
      id: "metrics",
      title: "Query latency metrics",
      description: "metrics.query · p95, 24 h window",
      status: stepStatus(b.runStart, b.toolMetricsDone),
      toolCall: { name: "metrics.query" },
      durationMs: frame >= b.toolMetricsDone ? TOOL_META.metrics.durationMs : undefined,
    },
    {
      id: "deploys",
      title: "Correlate recent deploys",
      description: "deploys.list · checkout-api",
      status: stepStatus(b.toolMetricsDone, b.toolDeploysDone),
      toolCall: { name: "deploys.list" },
      durationMs: frame >= b.toolDeploysDone ? TOOL_META.deploys.durationMs : undefined,
    },
    {
      id: "approve",
      title: "Post summary to #incidents",
      description: "Needs a human approval before posting.",
      status: approvalStatus,
    },
    {
      id: "respond",
      title: "Compose response",
      status:
        frame < b.streamStart ? "pending" : frame < b.streamEnd ? "active" : "completed",
    },
  ];

  const currentStepId =
    steps.find((s) => s.status === "active" || s.status === "waiting_approval")?.id ??
    (frame >= b.streamEnd ? "respond" : "plan");

  const run: AgentRun = {
    title: AGENT_RUN_TITLE,
    status:
      frame >= b.streamEnd
        ? "completed"
        : approvalStatus === "waiting_approval"
          ? "waiting"
          : "running",
    currentStepId,
    steps,
    summary:
      frame >= b.streamEnd
        ? "Root cause identified; summary posted to #incidents."
        : undefined,
  };

  // --- tool calls ---
  const call = (
    meta: (typeof TOOL_META)[keyof typeof TOOL_META],
    start: number,
    end: number,
  ): ToolCall => {
    const running = frame >= start && frame < end;
    return {
      id: meta.id,
      name: meta.name,
      category: meta.category,
      status: frame < start ? "queued" : running ? "running" : "completed",
      durationMs: frame >= end ? meta.durationMs : undefined,
      input: meta.input,
      output: frame >= end ? meta.output : undefined,
      progress: running ? Math.round(ramp(frame, start, end) * 10) / 10 : undefined,
    };
  };

  const postCall: ToolCall = {
    id: TOOL_META.post.id,
    name: TOOL_META.post.name,
    category: TOOL_META.post.category,
    status:
      frame < b.approvalAsk
        ? "queued"
        : frame < b.approvalOk
          ? "waiting_approval"
          : frame < b.approvalOk + 10
            ? "approved"
            : "completed",
    durationMs: frame >= b.approvalOk + 10 ? TOOL_META.post.durationMs : undefined,
    input: TOOL_META.post.input,
    output: frame >= b.approvalOk + 10 ? TOOL_META.post.output : undefined,
  };

  const calls: ToolCall[] = [
    call(TOOL_META.metrics, b.runStart, b.toolMetricsDone),
    call(TOOL_META.deploys, b.toolMetricsDone, b.toolDeploysDone),
    postCall,
  ];

  // --- response stream ---
  const streamProgress = ramp(frame, b.streamStart, b.streamEnd);
  // Three text chunks with citations after the first two.
  const perChunk = [0.45, 0.35, 0.2];
  const chunkFraction = (i: number): number => {
    const before = perChunk.slice(0, i).reduce((a, n) => a + n, 0);
    return Math.min(1, Math.max(0, (streamProgress - before) / perChunk[i]));
  };

  const segments: ResponseSegment[] = [];
  const fA = chunkFraction(0);
  if (fA > 0) segments.push({ type: "text", text: sliceWords(RESPONSE_TEXT_A, fA) });
  if (fA >= 1) segments.push({ type: "citation", sourceId: "1" });
  const fB = chunkFraction(1);
  if (fB > 0) segments.push({ type: "text", text: sliceWords(RESPONSE_TEXT_B, fB) });
  if (fB >= 1) segments.push({ type: "citation", sourceId: "2" });
  const fC = chunkFraction(2);
  if (fC > 0) segments.push({ type: "text", text: sliceWords(RESPONSE_TEXT_C, fC) });

  const streamState: StreamState =
    frame < b.streamStart ? "streaming" : streamProgress >= 1 ? "complete" : "streaming";

  return {
    composerValue: typed,
    composerStatus,
    run,
    calls,
    segments,
    streamState,
    streamProgress,
  };
}
