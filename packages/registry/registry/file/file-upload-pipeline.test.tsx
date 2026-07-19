import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileUploadPipeline, type UploadItem } from "./file-upload-pipeline";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const base = (over: Partial<UploadItem>): UploadItem => ({
  id: "f1",
  fileName: "quarterly-report.pdf",
  fileType: "application/pdf",
  fileSize: 2_400_000,
  progress: 0,
  status: "queued",
  ...over,
});

describe("FileUploadPipeline", () => {
  it("pauses and resumes an item through app callbacks (component never uploads)", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();
    const onResume = vi.fn();

    const { rerender } = render(
      <FileUploadPipeline items={[base({ status: "uploading", progress: 40 })]} onPause={onPause} onResume={onResume} />,
    );
    await user.click(screen.getByRole("button", { name: /pause quarterly-report\.pdf/i }));
    expect(onPause).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));

    // App flips the status to paused; the Resume control now appears.
    rerender(<FileUploadPipeline items={[base({ status: "paused", progress: 40 })]} onPause={onPause} onResume={onResume} />);
    await user.click(screen.getByRole("button", { name: /resume quarterly-report\.pdf/i }));
    expect(onResume).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
  });

  it("fires onRetry from a failed item", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <FileUploadPipeline
        items={[base({ status: "failed", progress: 62, error: "Connection reset by peer", retryCount: 1 })]}
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByRole("button", { name: /retry quarterly-report\.pdf/i }));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
  });

  it("fires onCancel for an in-flight item", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<FileUploadPipeline items={[base({ status: "uploading", progress: 20 })]} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel quarterly-report\.pdf/i }));
    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
  });

  it("exposes progress semantics via role=progressbar (value + text, not colour alone)", () => {
    render(<FileUploadPipeline items={[base({ status: "uploading", progress: 42 })]} />);
    const bar = screen.getByRole("progressbar", { name: /quarterly-report\.pdf upload progress/i });
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    // Status is present in text (aria-valuetext), never conveyed by colour alone.
    expect(bar.getAttribute("aria-valuetext")).toMatch(/uploading.*42%/i);
  });

  it("preserves focus after a removal by moving it to the neighbouring row's control", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [items, setItems] = React.useState<UploadItem[]>([
        base({ id: "a", fileName: "alpha.png", fileType: "image/png", status: "completed", progress: 100 }),
        base({ id: "b", fileName: "bravo.mp4", fileType: "video/mp4", status: "completed", progress: 100 }),
      ]);
      return (
        <FileUploadPipeline items={items} onRemove={(it) => setItems((prev) => prev.filter((p) => p.id !== it.id))} />
      );
    }

    render(<Harness />);
    const first = screen.getByRole("button", { name: /remove alpha\.png/i });
    first.focus();
    await user.click(first);

    // alpha is gone; focus must not be lost to <body> — it lands on bravo's Remove.
    await waitFor(() => expect(screen.queryByRole("button", { name: /remove alpha\.png/i })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /remove bravo\.mp4/i })));
  });

  it("renders an accessible failure state with an associated error and copy control", async () => {
    const onCopyError = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <FileUploadPipeline
        items={[
          base({ id: "ok", fileName: "logo.svg", fileType: "image/svg+xml", status: "completed", progress: 100 }),
          base({ id: "bad", fileName: "movie.mov", fileType: "video/quicktime", status: "failed", progress: 71, error: "Upload exceeded the size limit" }),
        ]}
        onRetry={() => {}}
        onRemove={() => {}}
        onCopyError={onCopyError}
      />,
    );
    // Error text is rendered (status conveyed in text, not colour alone).
    expect(screen.getByText(/exceeded the size limit/i)).toBeTruthy();
    // Copy control is wired to the error and notifies the app.
    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(onCopyError).toHaveBeenCalledWith(expect.objectContaining({ id: "bad" }));
    await noViolations(container);
  });
});
