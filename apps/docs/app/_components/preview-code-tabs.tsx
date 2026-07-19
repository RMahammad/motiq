"use client";

import * as React from "react";

/**
 * Preview / Code tab switcher for a component detail page. Both panels are
 * server-rendered and passed in as nodes; this client wrapper only toggles which
 * is shown. Both stay in the DOM (inactive one is `hidden`) so the source code is
 * always present for SEO and the live preview keeps its state across switches.
 */
export function PreviewCodeTabs({
  preview,
  code,
  idBase = "component",
}: {
  preview: React.ReactNode;
  code: React.ReactNode;
  idBase?: string;
}) {
  const [tab, setTab] = React.useState<"preview" | "code">("preview");
  const tabs = [
    { key: "preview" as const, label: "Preview" },
    { key: "code" as const, label: "Code" },
  ];

  // Roving arrow-key navigation across the two tabs (WAI-ARIA tabs pattern).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setTab((t) => (t === "preview" ? "code" : "preview"));
    } else if (e.key === "Home") {
      e.preventDefault();
      setTab("preview");
    } else if (e.key === "End") {
      e.preventDefault();
      setTab("code");
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Component preview and code"
        onKeyDown={onKeyDown}
        className="mb-3 inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1"
      >
        {tabs.map((t) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${idBase}-tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                selected
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${idBase}-panel-preview`}
        aria-labelledby={`${idBase}-tab-preview`}
        hidden={tab !== "preview"}
      >
        {preview}
      </div>
      <div
        role="tabpanel"
        id={`${idBase}-panel-code`}
        aria-labelledby={`${idBase}-tab-code`}
        tabIndex={0}
        hidden={tab !== "code"}
      >
        {code}
      </div>
    </div>
  );
}
