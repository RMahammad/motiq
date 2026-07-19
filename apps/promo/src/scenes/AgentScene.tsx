import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { AgentRunTimeline } from "@/registry/ai/agent-run-timeline";
import { AiResponseStream } from "@/registry/ai/ai-response-stream";
import { PromptComposer } from "@/registry/ai/prompt-composer";
import { ToolCallActivity } from "@/registry/ai/tool-call-activity";

import { agentAt, type AgentBeats } from "../adapters/agent";
import { STREAM_SOURCES } from "../data/agent";
import { copy } from "../campaign";
import { enter, inOut, ramp, rampE } from "../theme/anim";
import { Kicker, Rise } from "../theme/stage";

/**
 * Dense agent-workflow shot for the README hero: slim composer on top, run
 * timeline left, tool activity / response stream (crossfade) right. All state
 * comes from `agentAt(frame)` — the real components just render it.
 */
export const AgentSceneDense: React.FC<{
  beats: AgentBeats;
  streamSwap: number;
  /** Frames the prompt composer holds center stage before the workspace. */
  composerUntil?: number;
}> = ({ beats, streamSwap, composerUntil = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = agentAt(frame, beats);
  // Crisp handoff: activity clears fast, then the stream rises — no long
  // double exposure.
  const activityOut = 1 - ramp(frame, streamSwap, streamSwap + 4);
  const swap = enter({ frame, fps, delay: streamSwap + 3 });
  const composerOpacity =
    composerUntil > 0 ? inOut(frame, 0, composerUntil, 0, 5) : 0;
  const workspaceIn =
    composerUntil > 0 ? enter({ frame, fps, delay: composerUntil - 3 }) : 1;

  return (
    <AbsoluteFill style={{ padding: "40px 56px 36px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Rise>
          <Kicker>{copy.agent.kicker}</Kicker>
        </Rise>
      </div>
      {composerUntil > 0 && frame <= composerUntil ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: composerOpacity,
            zIndex: 2,
          }}
        >
          <ComposerShot beats={beats} width={780} />
        </AbsoluteFill>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: 20,
          flex: 1,
          minHeight: 0,
          opacity: workspaceIn,
          transform: `translateY(${(1 - workspaceIn) * 18}px)`,
        }}
      >
        <Rise style={{ flex: "0 0 47%", minWidth: 0 }}>
          <div style={{ overflow: "hidden", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", maxHeight: 560 }}>
            <AgentRunTimeline
              run={s.run}
              followActive={false}
              compactCompleted
              defaultExpanded={false}
            />
          </div>
        </Rise>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Rise delay={3} style={{ position: "absolute", inset: 0, opacity: activityOut }}>
            <div style={{ overflow: "hidden", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", maxHeight: 560 }}>
              <ToolCallActivity
                calls={s.calls}
                compactCompleted
                defaultExpanded={["tc-deploys"]}
              />
            </div>
          </Rise>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: swap,
              transform: `translateY(${(1 - swap) * 14}px)`,
            }}
          >
            <div style={{ overflow: "hidden", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", maxHeight: 560 }}>
              <AiResponseStream
                segments={s.segments}
                state={s.streamState}
                sources={STREAM_SOURCES}
                assistantName="Assistant"
                caret={false}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Large single-panel shots for the square/vertical spotlights. */
export const ComposerShot: React.FC<{ beats: AgentBeats; width?: number }> = ({
  beats,
  width = 720,
}) => {
  const frame = useCurrentFrame();
  const s = agentAt(frame, beats);
  return (
    <div style={{ width, maxWidth: "100%" }}>
      <PromptComposer
        value={s.composerValue}
        status={s.composerStatus}
        label="Prompt"
        placeholder="Ask the agent…"
        tokenCount={Math.round(s.composerValue.length / 4)}
        maxTokens={8192}
        submitLabel="Send"
        minRows={3}
        onSubmit={() => undefined}
      />
    </div>
  );
};

/** Run timeline alone — used by the vertical cut where columns don't fit. */
export const TimelineShot: React.FC<{ beats: AgentBeats; width?: number }> = ({
  beats,
  width = 880,
}) => {
  const frame = useCurrentFrame();
  const s = agentAt(frame, beats);
  return (
    <div style={{ width, maxWidth: "100%", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
      <AgentRunTimeline run={s.run} followActive={false} compactCompleted defaultExpanded={false} />
    </div>
  );
};

export const TimelineActivityShot: React.FC<{
  beats: AgentBeats;
  stacked?: boolean;
}> = ({ beats, stacked = false }) => {
  const frame = useCurrentFrame();
  const s = agentAt(frame, beats);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        gap: 20,
        alignItems: "flex-start",
        width: "100%",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
        <AgentRunTimeline run={s.run} followActive={false} compactCompleted defaultExpanded={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
        <ToolCallActivity calls={s.calls} compactCompleted defaultExpanded={false} />
      </div>
    </div>
  );
};

export const StreamShot: React.FC<{ beats: AgentBeats; width?: number }> = ({
  beats,
  width = 760,
}) => {
  const frame = useCurrentFrame();
  const s = agentAt(frame, beats);
  return (
    <div style={{ width, maxWidth: "100%", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
      <AiResponseStream
        segments={s.segments}
        state={s.streamState}
        sources={STREAM_SOURCES}
        assistantName="Assistant"
        caret={false}
      />
    </div>
  );
};

/** Utility used by compositions to time captions with the agent beats. */
export const agentCaptionOpacity = (
  frame: number,
  from: number,
  to: number,
): number => inOut(frame, from, to, 6, 6);

/**
 * README-hero AI scene (v2): one ACTIVE component at a time, large.
 * Phase A: Prompt Composer front and center; a realistic prompt is typed and
 * submitted. Phase B: Agent Run Timeline takes the stage, Tool Call Activity
 * slides in as the secondary panel (approval state included). Phase C: the
 * AI Response Stream streams to completion with its source citations.
 */
export const HeroAgentScene: React.FC<{
  beats: AgentBeats;
  /** Local frame where the workspace (timeline + activity) takes over. */
  workspaceAt: number;
  /** Local frame where the response stream takes over. */
  streamAt: number;
}> = ({ beats, workspaceAt, streamAt }) => {
  const frame = useCurrentFrame();
  const s = agentAt(frame, beats);

  // Symmetric crossfades (same window in and out) so combined opacity never
  // dips toward the background mid-transition.
  const swapA = rampE(frame, workspaceAt - 3, workspaceAt + 9);
  const swapB = rampE(frame, streamAt - 3, streamAt + 9);
  const aOut = 1 - swapA;
  const bIn = swapA;
  const bOut = 1 - swapB;
  const cIn = swapB;
  const activityIn = rampE(frame, workspaceAt + 8, workspaceAt + 22);

  const panelShell: React.CSSProperties = {
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    overflow: "hidden",
  };

  return (
    <AbsoluteFill>
      {/* Phase A — Prompt Composer */}
      {aOut > 0 ? (
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", opacity: aOut }}
        >
          <div style={{ transform: "scale(1.32)", transformOrigin: "center" }}>
            <ComposerShot beats={beats} width={720} />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Phase B — Run timeline (primary) + tool activity (secondary, slides in) */}
      {bIn > 0 && bOut > 0 ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.min(bIn, bOut),
            transform: `translateY(${(1 - bIn) * 14}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 20,
              width: 1150,
              maxWidth: "100%",
              alignItems: "flex-start",
              transform: "scale(1.08)",
              transformOrigin: "center",
            }}
          >
            <div style={{ flex: "0 0 54%", minWidth: 0, ...panelShell, maxHeight: 470 }}>
              <AgentRunTimeline
                run={s.run}
                followActive={false}
                compactCompleted
                defaultExpanded={false}
              />
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                ...panelShell,
                maxHeight: 470,
                opacity: activityIn,
                transform: `translateX(${(1 - activityIn) * 26}px)`,
              }}
            >
              <ToolCallActivity
                calls={s.calls}
                compactCompleted
                defaultExpanded={["tc-deploys"]}
              />
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Phase C — Response stream with source citations */}
      {cIn > 0 ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: cIn,
            transform: `translateY(${(1 - cIn) * 14}px)`,
          }}
        >
          <div style={{ transform: "scale(1.26)", transformOrigin: "center" }}>
            <StreamShot beats={beats} width={720} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
