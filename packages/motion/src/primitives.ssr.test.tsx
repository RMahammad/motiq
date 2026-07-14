import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InView } from "./in-view";
import { Stagger, StaggerItem } from "./stagger";

describe("InView / Stagger SSR", () => {
  it("InView SSRs with data-inview=false and its children", () => {
    const html = renderToString(<InView>hi</InView>);
    expect(html).toContain('data-inview="false"');
    expect(html).toContain("hi");
  });

  it("InView render-prop receives false on the server", () => {
    const html = renderToString(<InView>{(v) => <span>{String(v)}</span>}</InView>);
    expect(html).toContain(">false<");
  });

  it("Stagger SSRs items with indices, hidden by default", () => {
    const html = renderToString(
      <Stagger>
        <div>a</div>
        <StaggerItem>b</StaggerItem>
      </Stagger>,
    );
    expect(html).toContain('data-motion="hidden"');
    expect(html).toContain("scope-stagger-item");
    expect(html).toContain("--stagger-index:0");
    expect(html).toContain("--stagger-index:1");
  });
});
