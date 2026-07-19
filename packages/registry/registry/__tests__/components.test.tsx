import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { BlurText } from "../text/blur-text";
import { RotatingText } from "../text/rotating-text";
import { SpotlightCard } from "../creative/spotlight-card";
import { AnimatedList, AnimatedListItem } from "../creative/animated-list";
import { AnimatedGrid } from "../backgrounds/animated-grid";
import { AnimatedArrow, AnimatedCopy } from "../icons/animated-icons";
import { AnimatedButton } from "../animated-shadcn/animated-button";
import {
  AnimatedDialog,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
  AnimatedDialogHeader,
  AnimatedDialogBody,
  AnimatedDialogFooter,
  AnimatedDialogClose,
} from "../animated-shadcn/animated-dialog";
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsContent,
} from "../animated-shadcn/animated-tabs";
import {
  AnimatedAccordion,
  AnimatedAccordionItem,
  AnimatedAccordionTrigger,
  AnimatedAccordionContent,
} from "../animated-shadcn/animated-accordion";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

describe("BlurText", () => {
  it("exposes the full string once and hides animated segments", async () => {
    const { container } = render(<BlurText text="Hello motion world" as="h2" />);
    expect(screen.getByLabelText("Hello motion world")).toBeTruthy();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(1);
    await noViolations(container);
  });
});

describe("RotatingText", () => {
  it("renders a word and a polite live region", async () => {
    const { container } = render(<RotatingText words={["alpha", "beta"]} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    expect(live?.textContent).toContain("alpha");
    await noViolations(container);
  });
});

describe("AnimatedButton", () => {
  it("is a real button, sets aria-busy when loading, and respects disabled", async () => {
    const { rerender, container } = render(<AnimatedButton>Save</AnimatedButton>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn.tagName).toBe("BUTTON");
    rerender(<AnimatedButton loading>Save</AnimatedButton>);
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status")).toBeTruthy();
    rerender(<AnimatedButton disabled>Save</AnimatedButton>);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    await noViolations(container);
  });
});

function DialogFixture(props: React.ComponentProps<typeof AnimatedDialog>) {
  return (
    <AnimatedDialog {...props}>
      <AnimatedDialogTrigger>Open</AnimatedDialogTrigger>
      <AnimatedDialogContent>
        <AnimatedDialogHeader>
          <AnimatedDialogTitle>Invite</AnimatedDialogTitle>
          <AnimatedDialogDescription>Send an invite.</AnimatedDialogDescription>
        </AnimatedDialogHeader>
        <AnimatedDialogBody>
          <input aria-label="Email" />
        </AnimatedDialogBody>
        <AnimatedDialogFooter>
          <AnimatedDialogClose>Cancel</AnimatedDialogClose>
          <button type="button">Send</button>
        </AnimatedDialogFooter>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}

describe("AnimatedDialog", () => {
  it("opens centered with dialog semantics, a title, and no axe violations", async () => {
    const user = userEvent.setup();
    render(<DialogFixture />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Invite")).toBeTruthy();
    // centered layout on desktop (matchMedia mocked to non-matching)
    expect(dialog.className).toContain("max-w-lg");
    // long-content structure: exactly one scroll region (the body)
    expect(dialog.querySelector(".overflow-y-auto")).toBeTruthy();
    // built-in close is present and labelled
    expect(within(dialog).getByRole("button", { name: /close/i })).toBeTruthy();
    await noViolations(document.body);
  });

  it("renders the mobile sheet layout when the viewport matches", async () => {
    const orig = window.matchMedia;
    // Force the sheet media query to match.
    window.matchMedia = ((q: string) => ({
      matches: true, media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    })) as typeof window.matchMedia;
    try {
      const user = userEvent.setup();
      render(<DialogFixture mobileVariant="sheet" />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog.className).toContain("rounded-t-2xl");
      expect(dialog.className).toContain("bottom-0");
    } finally {
      window.matchMedia = orig;
    }
  });

  it("restores focus to the trigger on close and survives rapid reopen", async () => {
    // Force reduced motion so the exit is instant (unmount is not gated on an
    // animation), making focus restoration deterministic in jsdom.
    const orig = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: /prefers-reduced-motion/.test(q), media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    })) as typeof window.matchMedia;
    try {
      const user = userEvent.setup();
      render(<DialogFixture />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(document.activeElement).toBe(trigger); // Radix focus restore
      // rapid reopen works, single dialog
      await user.click(trigger);
      expect(await screen.findByRole("dialog")).toBeTruthy();
    } finally {
      window.matchMedia = orig;
    }
  });
});

describe("AnimatedTabs", () => {
  it("exposes tab roles and switches panel content", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AnimatedTabs defaultValue="a">
        <AnimatedTabsList>
          <AnimatedTabsTrigger value="a">One</AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="b">Two</AnimatedTabsTrigger>
        </AnimatedTabsList>
        <AnimatedTabsContent value="a">Panel A</AnimatedTabsContent>
        <AnimatedTabsContent value="b">Panel B</AnimatedTabsContent>
      </AnimatedTabs>,
    );
    expect(screen.getAllByRole("tab").length).toBe(2);
    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(await screen.findByText("Panel B")).toBeTruthy();
    await noViolations(container);
  });
});

describe("AnimatedAccordion", () => {
  it("toggles aria-expanded on the trigger", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AnimatedAccordion type="single" collapsible>
        <AnimatedAccordionItem value="a">
          <AnimatedAccordionTrigger>Question</AnimatedAccordionTrigger>
          <AnimatedAccordionContent>Answer</AnimatedAccordionContent>
        </AnimatedAccordionItem>
      </AnimatedAccordion>,
    );
    const trigger = screen.getByRole("button", { name: "Question" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await noViolations(container);
  });
});

describe("AnimatedList", () => {
  it("renders a semantic list of items", async () => {
    const { container } = render(
      <AnimatedList>
        <AnimatedListItem>One</AnimatedListItem>
        <AnimatedListItem>Two</AnimatedListItem>
      </AnimatedList>,
    );
    expect(container.querySelector("ul")).toBeTruthy();
    expect(container.querySelectorAll("li").length).toBe(2);
    await noViolations(container);
  });
});

describe("SpotlightCard", () => {
  it("renders children and has no violations", async () => {
    const { container } = render(
      <SpotlightCard>
        <h3>Feature</h3>
        <p>Description</p>
      </SpotlightCard>,
    );
    expect(screen.getByText("Feature")).toBeTruthy();
    await noViolations(container);
  });
});

describe("AnimatedGrid", () => {
  it("is decorative (aria-hidden) and adds no violations", async () => {
    const { container } = render(
      <div style={{ position: "relative", width: 200, height: 120 }}>
        <AnimatedGrid />
        <p>Foreground</p>
      </div>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    await noViolations(container);
  });
});

describe("Animated icons", () => {
  it("render decorative, non-focusable svgs inside labelled controls", async () => {
    const { container } = render(
      <div>
        <button type="button">
          Continue <AnimatedArrow triggerOn="hover" />
        </button>
        <button type="button">
          <AnimatedCopy copied={false} /> Copy key
        </button>
      </div>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => expect(svg.getAttribute("focusable")).toBe("false"));
    // icons are wrapped in aria-hidden spans; the buttons carry the accessible name
    expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy key/i })).toBeTruthy();
    await noViolations(container);
  });
});
