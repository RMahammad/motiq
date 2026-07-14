import { Suspense } from "react";
import type { Metadata } from "next";

import { product } from "../../lib/product";
import { CatalogBrowser } from "../_components/catalog-browser";

export const metadata: Metadata = {
  title: `Components — ${product.productName}`,
  description: "Browse animated React and shadcn components. Preview live, install as editable source.",
};

export default function ComponentsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-6 py-20 text-[var(--color-muted)]">Loading…</div>}>
      <CatalogBrowser />
    </Suspense>
  );
}
