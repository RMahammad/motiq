import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProcessingTimeline, type ProcessingStage } from "./processing-timeline";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const T0 = 1_720_000_000_000;

// An in-flight pipeline: two stages done, transcoding active, the rest pending.
function inFlightStages(): ProcessingStage[] {
  return [
    { id: "ingest", label: "Upload received", status: "completed", startTime: T0, duration: 900, output: { assetId: "a1" } },
    { id: "scan", label: "Virus scan", status: "completed", startTime: T0 + 1_000, duration: 2_100 },
    { id: "transcode", label: "Transcoding", status: "active", startTime: T0 + 3_200, progress: 46 },
    { id: "thumb", label: "Thumbnail generation", status: "pending" },
    { id: "caption", label: "Caption extraction", status: "pending", skippable: true },
    { id: "publish", label: "Publishing", status: "pending" },
  ];
}

describe("ProcessingTimeline", () => {
  it("marks the current stage with aria-current, exposes progress, and renders stages in order", async () => {
    const { container } = render(
      <ProcessingTimeline title="product-launch-v3.mp4" stages={inFlightStages()} currentStageId="transcode" />,
    );

    // Current-stage semantics: the transcoding header carries aria-current="step".
    const current = screen.getByRole("button", { name: /Transcoding/i });
    expect(current.getAttribute("aria-current")).toBe("step");

    // Progress is exposed with progressbar semantics + a textual value.
    const bar = screen.getByRole("progressbar", { name: /Transcoding progress/i });
    expect(bar.getAttribute("aria-valuenow")).toBe("46");
    expect(bar.getAttribute("aria-valuetext")).toMatch(/46%/);

    // Ordered progression: stages render as an ordered list in pipeline order.
    const list = screen.getByRole("list", { name: /stages/i });
    const labels = within(list).getAllByRole("listitem").map((li) => li.getAttribute("data-status"));
    expect(labels).toEqual(["completed", "completed", "active", "pending", "pending", "pending"]);

    await noViolations(container);
  });

  it("fires onRetryStage, onSkipStage, and onCancel from their controls", async () => {
    const user = userEvent.setup();
    const onRetryStage = vi.fn();
    const onSkipStage = vi.fn();
    const onCancel = vi.fn();

    const stages: ProcessingStage[] = [
      { id: "ingest", label: "Upload received", status: "completed", duration: 900 },
      { id: "transcode", label: "Transcoding", status: "failed", error: "Transcoder exited (code 69)." },
      { id: "caption", label: "Caption extraction", status: "active", progress: 20, skippable: true },
      { id: "publish", label: "Publishing", status: "pending" },
    ];

    render(
      <ProcessingTimeline
        title="asset.mp4"
        stages={stages}
        currentStageId="caption"
        onRetryStage={onRetryStage}
        onSkipStage={onSkipStage}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Retry Transcoding/i }));
    expect(onRetryStage).toHaveBeenCalledWith("transcode");

    await user.click(screen.getByRole("button", { name: /Skip Caption extraction/i }));
    expect(onSkipStage).toHaveBeenCalledWith("caption");

    // Job-level cancel is offered while the pipeline is still in flight.
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("summarises partial success (warnings) and a failed pipeline once resolved", async () => {
    const warned: ProcessingStage[] = [
      { id: "ingest", label: "Upload received", status: "completed", duration: 900 },
      { id: "caption", label: "Caption extraction", status: "warning", warning: "Low-confidence cues auto-corrected.", duration: 800 },
      { id: "publish", label: "Publishing", status: "completed", duration: 500 },
    ];
    const { rerender, container } = render(<ProcessingTimeline title="a.mp4" stages={warned} />);
    // Partial success footer + header pill.
    expect(screen.getByText(/Completed with warnings/i)).toBeTruthy();
    expect(screen.getAllByText(/warning/i).length).toBeGreaterThan(0);
    await noViolations(container);

    const failed: ProcessingStage[] = [
      { id: "ingest", label: "Upload received", status: "completed", duration: 900 },
      { id: "transcode", label: "Transcoding", status: "failed", error: "Unsupported HDR primaries." },
      { id: "publish", label: "Publishing", status: "cancelled" },
    ];
    rerender(<ProcessingTimeline title="a.mp4" stages={failed} onRetryStage={() => {}} />);
    expect(screen.getByText(/Pipeline failed/i)).toBeTruthy();
    // Failure text is present (icon + text, not colour alone) and retry is offered.
    expect(screen.getByText(/Unsupported HDR primaries/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Retry Transcoding/i })).toBeTruthy();
  });

  it("expands a stage's details via the keyboard (Enter on the header)", async () => {
    const user = userEvent.setup();
    render(<ProcessingTimeline title="a.mp4" stages={inFlightStages()} currentStageId="transcode" />);

    const header = screen.getByRole("button", { name: /Upload received/i });
    expect(header.getAttribute("aria-expanded")).toBe("false");

    header.focus();
    await user.keyboard("{Enter}");

    expect(header.getAttribute("aria-expanded")).toBe("true");
    // The disclosed region carries the stage's output artifact.
    const region = await screen.findByRole("region", { name: /Upload received details/i });
    expect(within(region).getByText(/assetId/i)).toBeTruthy();
  });
});
