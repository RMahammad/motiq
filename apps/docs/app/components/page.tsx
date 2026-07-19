import { Suspense } from "react";
import type { Metadata } from "next";

import { CatalogBrowser } from "../_components/catalog-browser";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Components",
  description:
    "Browse 60+ animated React and shadcn components - AI interfaces, dashboards, developer tools, and more. Preview live and install as editable source with the shadcn CLI.",
  path: "/components",
});

export default function ComponentsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-6 py-20 text-[var(--color-muted)]">Loading…</div>}>
      <CatalogBrowser />
    </Suspense>
  );
}
