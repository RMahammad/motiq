import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkflowTopologyField, type TopologyNode, type TopologyConnection } from "./workflow-topology-field";

afterEach(cleanup);

const edges = (c: HTMLElement) =>
  Array.from(c.querySelectorAll(".mk-wtf-edge")).map((p) => p.getAttribute("d"));
const glyphs = (c: HTMLElement) => c.querySelectorAll(".mk-wtf-glyph").length;
const nodeFills = (c: HTMLElement) => c.querySelectorAll(".mk-wtf-node-fill").length;

describe("WorkflowTopologyField", () => {
  it("renders identical geometry for the same seed (SSR-stable)", () => {
    const a = render(<WorkflowTopologyField seed={42} />);
    const first = edges(a.container);
    cleanup();
    const b = render(<WorkflowTopologyField seed={42} />);
    expect(first.length).toBeGreaterThan(0);
    expect(edges(b.container)).toEqual(first);
  });

  it("reducedMotion renders the static variant (no animation class, no flow)", () => {
    const { container } = render(<WorkflowTopologyField reducedMotion seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).not.toContain("mk-wtf-animated");
    expect(container.querySelectorAll(".mk-wtf-flow").length).toBe(0);
  });

  it("animates the active path by default", () => {
    const { container } = render(<WorkflowTopologyField seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).toContain("mk-wtf-animated");
    expect(container.querySelectorAll(".mk-wtf-flow").length).toBeGreaterThan(0);
  });

  it("marks a failed node with a non-color glyph (not color alone)", () => {
    const nodes: TopologyNode[] = [
      { id: "a", x: 0.2, y: 0.5, status: "completed" },
      { id: "b", x: 0.8, y: 0.5, status: "failed" },
    ];
    const connections: TopologyConnection[] = [{ from: "a", to: "b" }];
    const { container } = render(<WorkflowTopologyField nodes={nodes} connections={connections} />);
    // Every node renders a status glyph independent of color.
    expect(glyphs(container)).toBe(2);
  });

  it("pauses flow + lattice when hidden (data-paused wired)", () => {
    const { container } = render(<WorkflowTopologyField seed={3} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.getAttribute("data-paused")).toBeTruthy();
    const style = container.querySelector("style");
    expect(style?.textContent).toContain('[data-paused="true"]');
  });

  it("is aria-hidden and keeps children outside the decorative layer", () => {
    const { container, getByText } = render(
      <WorkflowTopologyField seed={3}>
        <h2>Readable headline</h2>
      </WorkflowTopologyField>,
    );
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("runs the field full-bleed — nodes behind the copy are softened, not dropped", () => {
    // The topology spans the whole frame on every placement. Center puts nodes
    // directly behind the copy; full-bleed means none is removed (they linger as
    // soft glowing tokens behind the frosted scrim), so the node count matches the
    // plain full-bleed field rather than thinning out.
    const plain = render(<WorkflowTopologyField contentPlacement="none" seed={9} />);
    const plainCount = nodeFills(plain.container);
    expect(plainCount).toBeGreaterThan(0);
    cleanup();
    for (const placement of ["left", "center", "right"] as const) {
      const r = render(<WorkflowTopologyField contentPlacement={placement} seed={9} />);
      expect(nodeFills(r.container)).toBe(plainCount);
      cleanup();
    }
  });

  it("renders a frosted-glass scrim behind the copy instead of masking the field away", () => {
    const withPlacement = render(
      <WorkflowTopologyField contentPlacement="left" seed={2}>
        <h2>Readable headline</h2>
      </WorkflowTopologyField>,
    );
    // A dedicated aria-hidden, pointer-events-none scrim layer sits behind the copy.
    const scrim = withPlacement.container.querySelector('[aria-hidden="true"].z-0');
    expect(scrim).not.toBeNull();
    expect(scrim?.className).toContain("pointer-events-none");
    // The decorative field layer carries NO CSS mask — it is full-bleed.
    const field = withPlacement.container.querySelector("[data-paused]");
    expect(field?.getAttribute("style") ?? "").not.toMatch(/mask/i);
    cleanup();
    // A full-bleed field (no placement) has no scrim.
    const noPlacement = render(
      <WorkflowTopologyField contentPlacement="none" seed={2}>
        <h2>Readable headline</h2>
      </WorkflowTopologyField>,
    );
    expect(noPlacement.container.querySelector('[aria-hidden="true"].z-0')).toBeNull();
  });

  it("hides a label that sits inside the content-placement safe area", () => {
    const nodes: TopologyNode[] = [{ id: "a", x: 0.1, y: 0.5, status: "active", label: "hidden-label" }];
    // contentPlacement="left" reserves the left half — a node at x≈0.1 is behind
    // the copy, so its label is suppressed for readability.
    const withPlacement = render(
      <WorkflowTopologyField nodes={nodes} contentPlacement="left" />,
    );
    expect(withPlacement.container.querySelectorAll(".mk-wtf-label").length).toBe(0);
    cleanup();
    // Without a placement (full-bleed field) the same label renders.
    const noPlacement = render(<WorkflowTopologyField nodes={nodes} contentPlacement="none" />);
    expect(noPlacement.container.querySelectorAll(".mk-wtf-label").length).toBe(1);
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<WorkflowTopologyField seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
  });
});
