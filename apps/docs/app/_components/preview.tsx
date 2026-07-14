import type { ReactNode } from "react";

/** Live component demo above its source snippet. Server-safe. */
export function Preview({ code, children }: { code: string; children: ReactNode }) {
  return (
    <div className="docs-preview">
      <div className="docs-preview__demo">{children}</div>
      <pre className="docs-preview__code">
        <code>{code}</code>
      </pre>
    </div>
  );
}
