import type { ReactNode } from "react";
import {
  Reveal,
  Stagger,
  StaggerItem,
  TextReveal,
  GradientText,
  Marquee,
  Counter,
  MotionScene,
  MotionStep,
  BlurReveal,
} from "@scope/motion";
import {
  PricingCard,
  SpotlightCard,
  BentoGrid,
  BentoGridItem,
  Skeleton,
  AnimatedButton,
  AnimatedDialog,
  Sheet,
  Tooltip,
  Popover,
} from "@scope/react";
import type { ProdFacts } from "../_components/component-stage";

export interface CatalogEntry {
  slug: string;
  name: string;
  category: "Primitive" | "Choreography" | "Production" | "Overlay" | "Signature" | "Text";
  tagline: string;
  code: string;
  facts: ProdFacts;
  Demo: () => ReactNode;
}

const base = (partial: Partial<ProdFacts>): ProdFacts => ({
  package: "@scope/react",
  importPath: "@scope/react",
  boundary: '"use client"',
  bundle: "~1 kB brotli",
  deps: "peer: react, react-dom · @scope/tokens",
  ssr: "renders final markup",
  a11y: "axe 0 (WCAG 2.2 AA scope)",
  reducedMotion: "final state, no transform",
  install: "pnpm add @scope/react",
  tests: "unit + SSR + axe",
  browser: "evergreen",
  limitations: "—",
  ...partial,
});

const DemoCard = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      padding: 20,
      borderRadius: 12,
      background: "var(--color-surface, #fff)",
      border: "1px solid var(--color-border, #e4e4e7)",
      color: "var(--color-fg, #18181b)",
      maxWidth: 320,
    }}
  >
    {children}
  </div>
);

export const CATALOG: CatalogEntry[] = [
  {
    slug: "motion-scene",
    name: "MotionScene",
    category: "Choreography",
    tagline: "Coordinate a section as one sequence — typed by role and intent.",
    code: `<MotionScene preset="product-introduction" intensity="standard">
  <MotionStep role="heading"><Heading /></MotionStep>
  <MotionStep role="supporting-content" intent="deemphasize"><Copy /></MotionStep>
  <MotionStep role="product-preview" intent="introduce"><Preview /></MotionStep>
  <MotionStep role="primary-action" intent="emphasize"><CTA /></MotionStep>
</MotionScene>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion · @scope/motion/motion-scene",
      bundle: "~1 kB brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "renders final/hidden state; animates after hydrate",
      a11y: "presentational container; children keep semantics · axe 0",
      reducedMotion: "steps render at final state, no transform",
      intents: "13 typed intents · none/reduced/standard/expressive intensity",
      install: "pnpm add @scope/motion",
      tests: "6 · unit + fake-timer + SSR + axe",
      limitations: "CSS-based; escalate to a spring engine for physics scenes",
    }),
    Demo: () => (
      <MotionScene trigger="mount" intensity="expressive" gap="lg" style={{ display: "grid", gap: 12, textAlign: "center" }}>
        <MotionStep role="heading">
          <strong style={{ fontSize: "1.4rem" }}>Introducing Scenes</strong>
        </MotionStep>
        <MotionStep role="supporting-content" intent="deemphasize">
          <span style={{ opacity: 0.7 }}>Heading → copy → preview → action, coordinated.</span>
        </MotionStep>
        <MotionStep role="product-preview" intent="introduce">
          <DemoCard>Any real component can be a step.</DemoCard>
        </MotionStep>
        <MotionStep role="primary-action" intent="emphasize">
          <button type="button" className="scope-btn">Primary action</button>
        </MotionStep>
      </MotionScene>
    ),
  },
  {
    slug: "reveal",
    name: "Reveal",
    category: "Primitive",
    tagline: "Fade/translate content into view — CSS + IntersectionObserver.",
    code: `<Reveal direction="up" distance="md" trigger="in-view">
  <Card />
</Reveal>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion · @scope/motion/reveal",
      bundle: "714 B brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "in-view → hidden final state; mount → shown",
      reducedMotion: "opacity 1, no transform, no transition",
      intents: "introduce",
      install: "pnpm add @scope/motion",
      tests: "8 · unit + SSR + axe",
      limitations: "for springs/gestures, escalate to a Motion-backed primitive",
    }),
    Demo: () => (
      <Reveal trigger="mount" direction="up" distance="lg">
        <DemoCard>Revealed on mount ↑</DemoCard>
      </Reveal>
    ),
  },
  {
    slug: "stagger",
    name: "Stagger",
    category: "Primitive",
    tagline: "Reveal a group of children with an incremental delay.",
    code: `<Stagger gap="md">
  <StaggerItem>One</StaggerItem>
  <StaggerItem>Two</StaggerItem>
  <StaggerItem>Three</StaggerItem>
</Stagger>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion · @scope/motion/stagger",
      bundle: "738 B brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "hidden until in view; auto-wraps non-item children",
      reducedMotion: "all items at final state instantly",
      install: "pnpm add @scope/motion",
      tests: "4 · unit + SSR",
      limitations: "linear delay; no easing of the stagger curve",
    }),
    Demo: () => (
      <Stagger trigger="mount" gap="md" style={{ display: "grid", gap: 10 }}>
        {["Choreographed", "Accessible", "Tree-shaken"].map((t) => (
          <StaggerItem key={t}>
            <DemoCard>{t}</DemoCard>
          </StaggerItem>
        ))}
      </Stagger>
    ),
  },
  {
    slug: "text-reveal",
    name: "TextReveal",
    category: "Text",
    tagline: "Reveal text by word or character — with an accessible split.",
    code: `<h1><TextReveal text="Ship faster" by="word" /></h1>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion · @scope/motion/text-reveal",
      bundle: "~700 B brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "full string in a visually-hidden copy; units aria-hidden",
      a11y: "SR reads whole string once; animated units aria-hidden · axe 0",
      reducedMotion: "text shows instantly",
      install: "pnpm add @scope/motion",
      tests: "5 · unit + SSR + axe",
      limitations: "prefer by='word' for long copy (character mode = many nodes)",
    }),
    Demo: () => (
      <strong style={{ fontSize: "1.8rem" }}>
        <TextReveal text="Author motion by intent" by="word" trigger="mount" />
      </strong>
    ),
  },
  {
    slug: "gradient-text",
    name: "GradientText",
    category: "Text",
    tagline: "Gradient-clipped text, optionally animated. Server-safe.",
    code: `<h1><GradientText from="#6366f1" to="#ec4899" animate>Ship it</GradientText></h1>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion/gradient-text",
      boundary: "server-safe (no hooks)",
      bundle: "405 B brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "renders real, selectable text",
      a11y: "real text; forced-colors falls back to system · axe 0",
      reducedMotion: "gradient animation disabled",
      install: "pnpm add @scope/motion",
      tests: "5 · unit + SSR + axe",
      limitations: "wrap in your own heading for semantics",
    }),
    Demo: () => (
      <strong style={{ fontSize: "2.4rem" }}>
        <GradientText from="#6366f1" via="#ec4899" to="#f59e0b" animate>
          Gradient
        </GradientText>
      </strong>
    ),
  },
  {
    slug: "counter",
    name: "Counter",
    category: "Text",
    tagline: "Animated number for KPI/stat blocks. Reduced motion jumps to value.",
    code: `<Counter value={1200} /> projects`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion/counter",
      bundle: "~1 kB brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "renders the starting value",
      a11y: "real text; final value announced",
      reducedMotion: "shows the final value immediately",
      install: "pnpm add @scope/motion",
      tests: "6 · unit + fake-timer + SSR",
      limitations: "format() is the caller's responsibility",
    }),
    Demo: () => (
      <strong style={{ fontSize: "3rem" }}>
        <Counter value={1200} startOnView={false} />
      </strong>
    ),
  },
  {
    slug: "marquee",
    name: "Marquee",
    category: "Primitive",
    tagline: "Seamless infinite scroll — pauses on hover, stops under reduced motion.",
    code: `<Marquee speed={20}>{logos}</Marquee>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion/marquee",
      boundary: "server-safe (no hooks)",
      bundle: "432 B brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "duplicate copy aria-hidden",
      a11y: "pauses on hover/focus; stops under reduced motion · axe 0",
      reducedMotion: "renders static",
      install: "pnpm add @scope/motion",
      tests: "4 · unit + SSR + axe",
      limitations: "add a visible pause control for strict WCAG on long motion",
    }),
    Demo: () => (
      <div style={{ width: "100%" }}>
        <Marquee speed={14}>
          {["ACME", "GLOBEX", "INITECH", "HOOLI", "PIED PIPER"].map((n) => (
            <span key={n} style={{ fontFamily: "var(--lab-mono)", opacity: 0.7 }}>
              {n}
            </span>
          ))}
        </Marquee>
      </div>
    ),
  },
  {
    slug: "blur-reveal",
    name: "BlurReveal",
    category: "Primitive",
    tagline: "Fade + de-blur entrance — a headline effect.",
    code: `<BlurReveal amount="md"><h2>Focus</h2></BlurReveal>`,
    facts: base({
      package: "@scope/motion",
      importPath: "@scope/motion/blur-reveal",
      bundle: "721 B brotli",
      deps: "peer: react, react-dom · @scope/tokens",
      ssr: "hidden final state",
      reducedMotion: "renders sharp/visible instantly",
      install: "pnpm add @scope/motion",
      tests: "4 · unit + SSR",
      limitations: "keep amount modest — large blur is GPU-heavy",
    }),
    Demo: () => (
      <BlurReveal trigger="mount" amount="lg">
        <strong style={{ fontSize: "1.8rem" }}>Into focus</strong>
      </BlurReveal>
    ),
  },
  {
    slug: "pricing-card",
    name: "PricingCard",
    category: "Production",
    tagline: "Themeable, accessible pricing plan card.",
    code: `<PricingCard planName="Pro" price="$29" period="/mo"
  features={["Unlimited projects", "Priority support"]}
  cta={{ label: "Start", href: "#" }} featured badge="Most popular" />`,
    facts: base({
      importPath: "@scope/react · @scope/react/pricing-card",
      bundle: "~1 kB brotli",
      deps: "peer: react, react-dom · @scope/motion, @scope/tokens",
      a11y: 'role="group" labelled by heading · real <ul> · button/link CTA · axe 0',
      intents: "introduce (via Reveal), emphasize (featured)",
      tests: "8 · unit + SSR + axe",
      browser: "evergreen; forced-colors supported",
      limitations: "not a full pricing section (compose with FeatureGrid/CTASection)",
    }),
    Demo: () => (
      <div style={{ maxWidth: 320, width: "100%" }}>
        <PricingCard
          planName="Pro"
          price="$29"
          period="/mo"
          description="For growing teams"
          features={["Unlimited projects", "Priority support"]}
          cta={{ label: "Start free trial", href: "#" }}
          featured
          badge="Most popular"
        />
      </div>
    ),
  },
  {
    slug: "spotlight-card",
    name: "SpotlightCard",
    category: "Signature",
    tagline: "Pointer-tracked spotlight; hidden on touch.",
    code: `<SpotlightCard radius={240}>…</SpotlightCard>`,
    facts: base({
      importPath: "@scope/react/spotlight-card",
      a11y: "decorative ::before; content unaffected · axe 0",
      reducedMotion: "spotlight fade removed",
      intents: "emphasize (hover affordance)",
      tests: "4 · pointer-var + SSR + axe",
      browser: "evergreen; hidden on hover:none (touch)",
      limitations: "hover-only; pair with a focus style for keyboard emphasis",
    }),
    Demo: () => (
      <SpotlightCard radius={220} style={{ maxWidth: 320, width: "100%" }}>
        <h3 style={{ margin: 0 }}>Hover for a spotlight</h3>
        <p style={{ marginTop: 8 }}>Pointer-tracked highlight.</p>
      </SpotlightCard>
    ),
  },
  {
    slug: "bento-grid",
    name: "BentoGrid",
    category: "Production",
    tagline: "Responsive bento layout with spanning content cells.",
    code: `<BentoGrid columns={3}>
  <BentoGridItem colSpan={2} rowSpan={2} title="Fast" description="Sub-second builds." />
  <BentoGridItem title="Accessible" description="WCAG 2.2 AA." />
</BentoGrid>`,
    facts: base({
      importPath: "@scope/react/bento-grid",
      boundary: "server-safe (composes Reveal as a client leaf)",
      a11y: "real headings per item; media needs alt · axe 0",
      tests: "4 · unit + SSR + axe",
      limitations: "single column on mobile; spans collapse",
    }),
    Demo: () => (
      <BentoGrid columns={2} style={{ maxWidth: 360 }}>
        <BentoGridItem colSpan={2} title="Fast" description="Sub-second builds." />
        <BentoGridItem title="Typed" description="Strict TS." />
        <BentoGridItem title="Tiny" description="Size budgets." />
      </BentoGrid>
    ),
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    category: "Production",
    tagline: "Loading placeholder with a shimmer. Server-safe.",
    code: `<Skeleton variant="text" width="60%" />`,
    facts: base({
      importPath: "@scope/react/skeleton",
      boundary: "server-safe (no hooks)",
      bundle: "368 B brotli",
      a11y: "aria-hidden; put aria-busy on the region · axe 0",
      reducedMotion: "shimmer stops (solid block)",
      tests: "4 · unit + SSR + axe",
      limitations: "decorative; announce loading on the surrounding region",
    }),
    Demo: () => (
      <div style={{ display: "grid", gap: 10, width: 260 }} role="status" aria-busy="true" aria-label="Loading">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton height={80} />
      </div>
    ),
  },
  {
    slug: "animated-button",
    name: "AnimatedButton",
    category: "Production",
    tagline: "Button that can reveal in on mount.",
    code: `<AnimatedButton revealOnMount>Get started</AnimatedButton>`,
    facts: base({
      importPath: "@scope/react/animated-button",
      bundle: "~0.5 kB brotli",
      a11y: "native <button>; keyboard + focus · axe 0",
      reducedMotion: "reveal → final state",
      tests: "covered via react suite",
      limitations: "style via .scope-btn or className",
    }),
    Demo: () => (
      <AnimatedButton revealOnMount type="button" className="scope-btn">
        Get started
      </AnimatedButton>
    ),
  },
  {
    slug: "dialog",
    name: "AnimatedDialog",
    category: "Overlay",
    tagline: "Radix modal, focus trap + restore, CSS enter/exit.",
    code: `<AnimatedDialog trigger={<button>Open</button>} title="Delete project"
  description="This cannot be undone.">…</AnimatedDialog>`,
    facts: base({
      importPath: "@scope/react/dialog",
      bundle: "~1 kB wrapper (Radix external)",
      deps: "peer: react, react-dom · @radix-ui/react-dialog · @scope/tokens",
      ssr: "closed → trigger only; content mounts on open",
      a11y: 'role="dialog" labelled by title · focus trap + restore · Esc closes · axe 0',
      reducedMotion: "keyframe enter/exit disabled",
      install: "pnpm add @scope/react @radix-ui/react-dialog",
      tests: "7 · focus/escape/restore + SSR + axe",
      limitations: "single modal; use Sheet for edge drawers",
    }),
    Demo: () => (
      <AnimatedDialog
        trigger={<button type="button" className="scope-btn">Open dialog</button>}
        title="Delete project"
        description="This action cannot be undone."
      >
        <button type="button" className="scope-btn">Confirm delete</button>
      </AnimatedDialog>
    ),
  },
  {
    slug: "sheet",
    name: "Sheet",
    category: "Overlay",
    tagline: "Edge-anchored drawer with a per-side slide.",
    code: `<Sheet trigger={<button>Filters</button>} title="Filters" side="right">…</Sheet>`,
    facts: base({
      importPath: "@scope/react/sheet",
      bundle: "~0.6 kB wrapper (Radix external)",
      deps: "peer: react, react-dom · @radix-ui/react-dialog · @scope/tokens",
      ssr: "closed → trigger only",
      a11y: 'role="dialog" labelled by title · focus trap + restore · Esc · axe 0',
      reducedMotion: "slide disabled (appears instantly)",
      install: "pnpm add @scope/react @radix-ui/react-dialog",
      tests: "4 · focus/escape + SSR + axe",
      limitations: "modal only; uses 100dvh/100vw",
    }),
    Demo: () => (
      <Sheet
        trigger={<button type="button" className="scope-btn">Open sheet</button>}
        title="Filters"
        description="Refine the results."
        side="right"
      >
        <button type="button" className="scope-btn">Apply</button>
      </Sheet>
    ),
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    category: "Overlay",
    tagline: "Hover/focus tooltip on Radix. role='tooltip'.",
    code: `<Tooltip content="Save changes"><button>Save</button></Tooltip>`,
    facts: base({
      importPath: "@scope/react/tooltip",
      bundle: "440 B wrapper (Radix external)",
      deps: "peer: react, react-dom · @radix-ui/react-tooltip · @scope/tokens",
      ssr: "renders nothing until opened",
      a11y: 'opens on focus + hover · role="tooltip" · Esc · axe 0',
      reducedMotion: "fade disabled",
      install: "pnpm add @scope/react @radix-ui/react-tooltip",
      tests: "3 · interaction + axe",
      limitations: "not for interactive content — use Popover",
    }),
    Demo: () => (
      <Tooltip content="Saves your work">
        <button type="button" className="scope-btn">Hover or focus me</button>
      </Tooltip>
    ),
  },
  {
    slug: "popover",
    name: "Popover",
    category: "Overlay",
    tagline: "Click-triggered panel; focus move/restore, Esc, outside-click.",
    code: `<Popover trigger={<button>Menu</button>} closeLabel="Close">…</Popover>`,
    facts: base({
      importPath: "@scope/react/popover",
      bundle: "476 B wrapper (Radix external)",
      deps: "peer: react, react-dom · @radix-ui/react-popover · @scope/tokens",
      ssr: "renders nothing until opened",
      a11y: "focus moves in / restores on close · Esc · outside-click · axe 0",
      reducedMotion: "fade disabled",
      install: "pnpm add @scope/react @radix-ui/react-popover",
      tests: "3 · interaction + axe",
      limitations: "non-modal; use AnimatedDialog for blocking",
    }),
    Demo: () => (
      <Popover trigger={<button type="button" className="scope-btn">Open popover</button>} closeLabel="Close">
        <p style={{ margin: 0 }}>Popover panel content.</p>
      </Popover>
    ),
  },
];

export const BY_SLUG = new Map(CATALOG.map((e) => [e.slug, e]));
