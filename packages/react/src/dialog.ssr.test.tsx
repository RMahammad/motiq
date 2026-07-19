import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimatedDialog } from "./dialog";

describe("AnimatedDialog SSR", () => {
  it("renders the trigger and no portal content when closed (default)", () => {
    const html = renderToString(
      <AnimatedDialog trigger={<button type="button">Open</button>} title="Confirm">
        <p>Body</p>
      </AnimatedDialog>,
    );
    expect(html).toContain("Open");
    // closed dialog: portal content (title/body) is not rendered on the server
    expect(html).not.toContain("Confirm");
    expect(html).not.toContain("Body");
  });
});
