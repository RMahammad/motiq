import Link from "next/link";

import { catalog } from "../../lib/catalog";
import { product, installCommand } from "../../lib/product";
import { pageMetadata } from "../../lib/seo";
import { InstallCommand } from "../_components/code-block";

export const metadata = pageMetadata({
  title: "Get started",
  description: `Install ${product.productName} components as editable source with the shadcn CLI — one command, no account, no config, nothing to register.`,
  path: "/getting-started",
});

// Representative component used in the example commands, so they are copy-runnable
// rather than placeholders. Falls back to the first catalog item.
const example = catalog.find((c) => (c.kind ?? "component") === "component") ?? catalog[0];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={`step-${n}`} className="scroll-mt-20 border-t border-[var(--color-border)] py-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] text-[13px] font-semibold text-[var(--color-fg)]">
          {n}
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      </div>
      <div className="pl-10">{children}</div>
    </section>
  );
}

export default function GettingStartedPage() {
  return (
    <div className="mx-auto max-w-[820px] px-4 py-12 sm:px-6">
      <header className="mb-4">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {product.productName}
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Get started
        </h1>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
          {product.productName} components install as editable source through a shadcn-compatible
          registry. One command per component — no account, no config, nothing to register. The
          source lands in your project and you own it.
        </p>
      </header>

      <Step n={1} title="Prerequisites">
        <p className="text-[14px] leading-relaxed text-[var(--color-muted)]">
          A React or Next.js project with the{" "}
          <a
            href="https://ui.shadcn.com/docs/installation"
            className="text-[var(--color-accent)] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            shadcn CLI initialized
          </a>{" "}
          (<code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[12px]">npx shadcn@latest init</code>).
          That sets up Tailwind and the <code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[12px]">@/lib/utils</code>{" "}
          <code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[12px]">cn()</code> helper the components use.
        </p>
      </Step>

      <Step n={2} title="Add any component">
        <p className="mb-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Install anything in the catalog with one command — no account, no config, nothing to
          register. Dependencies (utilities, primitives, and any composed components) are pulled in
          automatically:
        </p>
        <InstallCommand command={installCommand(example.registryItem)} />
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          Browse the full catalog on the{" "}
          <Link href="/components" className="text-[var(--color-accent)] underline underline-offset-2">
            components
          </Link>{" "}
          page — each page lists its exact install command.
        </p>
      </Step>

      <section className="border-t border-[var(--color-border)] py-8">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--color-fg)]">What you get</h2>
        <ul className="space-y-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          <li>· Real, editable source in your repo — no black-box package to wrap.</li>
          <li>· Accessible and reduced-motion-safe by default, with dark mode built in.</li>
          <li>· Free and open: the whole catalog is public and installable.</li>
        </ul>
      </section>
    </div>
  );
}
