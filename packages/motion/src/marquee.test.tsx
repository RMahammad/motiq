import { render, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { Marquee } from "./marquee";

afterEach(cleanup);

describe("Marquee", () => {
  it("duplicates children with the copy aria-hidden (seamless loop)", () => {
    const { container, getAllByText } = render(
      <Marquee>
        <span>LOGO</span>
      </Marquee>,
    );
    const groups = container.querySelectorAll(".scope-marquee__group");
    expect(groups).toHaveLength(2);
    expect(groups[1]!.getAttribute("aria-hidden")).toBe("true");
    // both copies render the content (one is aria-hidden)
    expect(getAllByText("LOGO")).toHaveLength(2);
  });

  it("sets duration var and toggles reverse / pause-on-hover data attrs", () => {
    const { container } = render(
      <Marquee speed={30} reverse pauseOnHover={false}>
        x
      </Marquee>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--marquee-duration")).toBe("30s");
    expect(el.getAttribute("data-reverse")).toBe("true");
    expect(el.getAttribute("data-pause-hover")).toBeNull();
  });

  it("SSRs (server-safe)", () => {
    const html = renderToString(
      <Marquee>
        <span>ACME</span>
      </Marquee>,
    );
    expect(html).toContain("scope-marquee");
    expect(html).toContain("ACME");
    expect(html).toContain('aria-hidden="true"');
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Marquee aria-label="Trusted by">
        <a href="/a">Acme</a>
        <a href="/b">Globex</a>
      </Marquee>,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
