import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * The composed children resolve through the `@/components/motiq/*` tsconfig
 * paths, which the registry's vitest config does not alias. They are exercised by
 * their own tests; here they are stubbed with faithful, minimal presentational
 * shims so this block test stays isolated and fast. The shims render the pieces
 * the block relies on (titles, children, and — for the timeline — the approval /
 * retry controls) so the composition still renders end to end.
 */
vi.mock("@/components/motiq/agent-run-timeline", () => ({
  AgentRunTimeline: ({ run, onApprove, onReject, onRetryStep }: any) => (
    <section aria-label={`Run: ${run.title}`}>
      <h2>{run.title}</h2>
      <ul>
        {run.steps.map((s: any) => (
          <li key={s.id} data-status={s.status}>
            {s.title}
            {s.status === "waiting_approval" ? (
              <>
                <button type="button" onClick={() => onApprove?.(s.id)}>
                  Approve
                </button>
                <button type="button" onClick={() => onReject?.(s.id)}>
                  Reject
                </button>
              </>
            ) : null}
            {s.status === "failed" ? (
              <button type="button" onClick={() => onRetryStep?.(s.id)}>
                Retry
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  ),
}));

vi.mock("@/components/motiq/tool-call-activity", () => ({
  ToolCallActivity: ({ calls, title }: any) => (
    <section aria-label={title}>
      {calls.map((c: any) => (
        <div key={c.id} data-status={c.status}>
          {c.name}
        </div>
      ))}
    </section>
  ),
}));

vi.mock("@/components/motiq/source-citation-rail", () => ({
  SourceCitationRail: ({ children, title }: any) => (
    <section aria-label={title}>{children}</section>
  ),
  CitationMarker: ({ source }: any) => <sup>[{source}]</sup>,
}));

vi.mock("@/components/motiq/prompt-composer", () => ({
  PromptComposer: ({ defaultValue, label, status }: any) => (
    <div aria-label={label} data-status={status}>
      {defaultValue}
    </div>
  ),
}));

import {
  AgentOperationsHero,
  type AgentHeroPhase,
} from "./agent-operations-hero";

afterEach(cleanup);

const PHASES: AgentHeroPhase[] = [
  "idle",
  "running",
  "tool-active",
  "waiting",
  "completed",
  "failed",
];

const PHASE_LABEL: Record<AgentHeroPhase, string> = {
  idle: "Idle",
  running: "Running",
  "tool-active": "Tool running",
  waiting: "Waiting for approval",
  completed: "Completed",
  failed: "Failed",
};

describe("AgentOperationsHero", () => {
  it("renders with default demo data without throwing", () => {
    const { getByRole } = render(<AgentOperationsHero />);
    expect(getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("renders the headline as a real heading", () => {
    const { getByRole } = render(
      <AgentOperationsHero headline="Ship approvable agents" />,
    );
    const heading = getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Ship approvable agents");
  });

  it("renders both primary and secondary CTAs", () => {
    const { getByText } = render(
      <AgentOperationsHero
        primaryCta={{ label: "Get started", href: "#start" }}
        secondaryCta={{ label: "Read the docs", href: "#docs" }}
      />,
    );
    expect(getByText("Get started")).toBeTruthy();
    expect(getByText("Read the docs")).toBeTruthy();
  });

  it("renders a button CTA when no href is given", () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <AgentOperationsHero primaryCta={{ label: "Launch", onClick }} />,
    );
    expect(getByText("Launch").tagName).toBe("BUTTON");
  });

  it("renders every required phase with its status label", () => {
    for (const phase of PHASES) {
      const { container, unmount } = render(<AgentOperationsHero phase={phase} />);
      expect(container.textContent).toContain(
        `Live status: ${PHASE_LABEL[phase]}`,
      );
      unmount();
    }
  });

  it("honours defaultPhase (uncontrolled)", () => {
    const { container } = render(<AgentOperationsHero defaultPhase="waiting" />);
    expect(container.querySelector('[data-phase="waiting"]')).toBeTruthy();
  });

  it("is SSR-deterministic — two static renders are identical", () => {
    const a = renderToStaticMarkup(<AgentOperationsHero defaultPhase="running" />);
    const b = renderToStaticMarkup(<AgentOperationsHero defaultPhase="running" />);
    expect(a).toBe(b);
  });

  it("renders with reducedMotion without throwing", () => {
    const { getByRole } = render(<AgentOperationsHero reducedMotion />);
    expect(getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("renders a decorative background slot when provided", () => {
    const { getByTestId } = render(
      <AgentOperationsHero background={<div data-testid="bg" />} />,
    );
    expect(getByTestId("bg")).toBeTruthy();
  });
});

/*
 * Responsive contract. jsdom cannot lay out, so these pin the structure that
 * makes 375px work: equal full-width 44px CTAs, and a real disclosure that keeps
 * the tool call + cited sources off the phone's first screen while leaving the
 * `lg` two-column composition untouched.
 */
describe("AgentOperationsHero — responsive contract", () => {
  it("renders both CTAs as full-width 44px bars that revert to intrinsic width at sm", () => {
    const { getByText } = render(
      <AgentOperationsHero
        primaryCta={{ label: "Get started", href: "#start" }}
        secondaryCta={{ label: "Read the docs", href: "#docs" }}
      />,
    );
    for (const label of ["Get started", "Read the docs"]) {
      const cls = getByText(label).className;
      expect(cls).toContain("w-full");
      expect(cls).toContain("@2xl/hero:w-auto");
      expect(cls).toContain("min-h-[44px]");
    }
  });

  it("puts the result column behind a keyboard-operable disclosure below lg", async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<AgentOperationsHero />);
    const trigger = getByRole("button", { name: /show tool call and sources/i });
    expect(trigger.className).toContain("@4xl/surface:hidden");
    expect(trigger.className).toContain("min-h-[44px]");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel).toBeTruthy();
    // Collapsed on a phone, but always laid out at `lg` — CSS, not a JS branch.
    expect(panel!.className).toContain("hidden");
    expect(panel!.className).toContain("@4xl/surface:flex");

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel!.className).toContain("flex");
    expect(panel!.className).not.toContain("hidden");
  });

  it("honours defaultDetailsOpen for consumers that want the panel open", () => {
    const { getByRole } = render(<AgentOperationsHero defaultDetailsOpen />);
    const trigger = getByRole("button", { name: /hide tool call and sources/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps the headline fluid with a mobile-legible clamp floor", () => {
    const { getByRole } = render(<AgentOperationsHero />);
    // 1.75rem = 28px at 320-375px; the 3.25rem ceiling is the untouched desktop size.
    expect(getByRole("heading", { level: 1 }).className).toContain(
      "text-[clamp(1.75rem,1.1rem+2.8cqi,3.25rem)]",
    );
  });
});
