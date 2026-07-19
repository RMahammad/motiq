import React from "react";
import { useCurrentFrame } from "remotion";

import { DeploymentPipeline } from "@/registry/developer-tools/deployment-pipeline";

import { pipelineAt, type PipelineBeats } from "../adapters/pipeline";
import { PIPELINE_WINDOW_META, PIPELINE_WINDOW_TITLE } from "../data/pipeline";
import { Window } from "../theme/stage";

/**
 * Holds real keyboard focus on the pipeline's Retry button while `active` —
 * the library's own focus ring does the rest (see style.css).
 */
const FocusRetry: React.FC<{ active: boolean; children: React.ReactNode }> = ({
  active,
  children,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  // Layout effect: focus must land before Remotion screenshots the frame.
  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const retry = Array.from(root.querySelectorAll("button")).find((b) =>
      /retry/i.test(b.textContent ?? ""),
    );
    if (active && retry) {
      retry.focus();
      // Unfocused (headless) pages never match CSS :focus, so the library's
      // ring token is mirrored via an attribute the promo stylesheet paints.
      retry.setAttribute("data-promo-focus", "");
    } else if (!active) {
      const el = document.activeElement;
      if (el instanceof HTMLElement && root.contains(el)) el.blur();
      root
        .querySelectorAll("[data-promo-focus]")
        .forEach((el) => el.removeAttribute("data-promo-focus"));
    }
  }, [active]);
  return (
    <div ref={ref} className="promo-focus-ring">
      {children}
    </div>
  );
};

/**
 * The deployment story: real DeploymentPipeline fed frame-derived stages.
 * `width` sizes the console window; the component is fluid inside it.
 */
export const PipelinePanel: React.FC<{
  beats: PipelineBeats;
  width?: number;
  maxHeight?: number;
}> = ({ beats, width = 660, maxHeight }) => {
  const frame = useCurrentFrame();
  const s = pipelineAt(frame, beats);
  return (
    <Window
      title={PIPELINE_WINDOW_TITLE}
      meta={PIPELINE_WINDOW_META}
      style={{ width, maxWidth: "100%" }}
    >
      <FocusRetry active={s.focusRetry}>
        <div style={maxHeight ? { maxHeight, overflow: "hidden" } : undefined}>
          <DeploymentPipeline
            key={s.panelKey}
            stages={s.stages}
            defaultExpandedId={s.expandedId}
            onRetry={() => undefined}
            label="Production deploy pipeline"
          />
        </div>
      </FocusRetry>
    </Window>
  );
};
