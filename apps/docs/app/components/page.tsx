import { Suspense } from "react";
import type { Metadata } from "next";

import { CatalogBrowser } from "../_components/catalog-browser";
import { pageMetadata } from "../../lib/seo";
import { componentItems, blockItems } from "../../lib/catalog";

// Derived, never hardcoded — a literal here drifts silently every time the
// catalog grows (this description was frozen at "60+" for four batches).
export const metadata: Metadata = pageMetadata({
  title: "Components",
  description: `Browse ${componentItems().length} animated React and shadcn components and ${blockItems().length} composed workflow blocks - AI interfaces, dashboards, developer tools, and more. Preview live and install as editable source with the shadcn CLI.`,
  path: "/components",
});

export default function ComponentsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-6 py-20 text-[var(--color-muted)]">Loading…</div>}>
      <CatalogBrowser />
    </Suspense>
  );
}
