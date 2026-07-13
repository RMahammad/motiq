# 09 — Component API standard

> **Type:** 🟢 Canonical component-authoring contract · **Implementation status:** 🔵 Planned · **Last reviewed:** 2026-07-14
> **Owns:** the three API levels, the universal prop contract, naming conventions, and the reference implementations.
> **Related:** [`10-design-tokens.md`](10-design-tokens.md) · [`11-tailwind-strategy.md`](11-tailwind-strategy.md) · [`12-accessibility-standard.md`](12-accessibility-standard.md) · [`component-authoring` skill](../.claude/skills/component-authoring/SKILL.md) · [`api-consistency-review` skill](../.claude/skills/api-consistency-review/SKILL.md)

## Three API levels

Simple stays simple; experts aren't blocked.

### Level 1 — semantic props (≈90% of users)
```tsx
<Reveal direction="up" distance="md" duration="normal" trigger="in-view" once>
  <PricingCard />
</Reveal>
```

### Level 2 — tokens & presets (advanced)
```tsx
<Reveal preset="emphasized" intensity="expressive" delay="sm" />
```

### Level 3 — escape hatch (experts), namespaced
```tsx
<Reveal motionProps={{ transition: { type: "spring", stiffness: 300 } }} />
```
`motionProps` is documented as *"advanced; may pass through engine-specific objects; **not** covered by the semver stability of the semantic API."* This lets the engine change without breaking Levels 1–2. Never make Level 3 the *only* way to do something common.

## Universal contract (every interactive component)

| Concern | Rule |
|---|---|
| `className` | Always accepted; merged **last** via `cn()` (tailwind-merge wins) |
| `style` | Accepted; CSS-var overrides supported |
| `children` / `asChild` | `asChild` (Radix Slot) only where polymorphism helps |
| refs | `forwardRef` to the primary DOM node, always |
| Controlled/uncontrolled | Both, React convention (`value`/`defaultValue` + `onValueChange`) |
| Animation toggle | `animate={false}` disables; reduced motion respected regardless |
| Timing | `duration`/`delay`/`easing` accept **token names** (`"normal"`), not raw ms, at Level 1 |
| Motion preset | `preset` prop from a typed union |
| Reduced motion | Automatic; `reducedMotion="respect" \| "force-reduce" \| "allow"` override |
| Trigger | `trigger="mount" \| "in-view"`; `once`; `viewportMargin` |
| Callbacks | `onAnimationStart` / `onAnimationComplete` / `onVisibilityChange` |
| Data attributes | `data-state`, `data-motion`, `data-reduced-motion` for styling hooks |
| Slots | Documented `data-slot="…"` + slot className props on composed components |
| SSR-safe defaults | No layout-measuring on first render; render final state, animate after hydrate |

## Naming & type conventions

- Components `PascalCase`; files `kebab-case.tsx`; hooks `useX`; utilities `camelCase`.
- Boolean props **positive** (`once`, not `disableRepeat`).
- Event callbacks `onX`; controlled props `value`/`onValueChange` (+ `defaultValue`).
- Variants are **typed unions**, not free strings.
- CSS vars `--motion-*` / `--<comp>-*`; data attributes `data-slot`/`data-state`/`data-motion`.
- Public types are exported and documented; internal types are **not** exported.
- Do **not** expose hundreds of Tailwind class props — semantic props + slots + CSS vars + one `className`. See [`11`](11-tailwind-strategy.md).

## Good vs bad API

| ✅ Good | ❌ Bad |
|---|---|
| `<Reveal duration="normal" />` | `<Reveal ms={340} ease={[0.2,0,0,1]} />` at Level 1 |
| `variant="primary"` (typed union) | `variant={someString}` |
| `onOpenChange` (controlled) | `onToggle` + internal-only state |
| `motionProps={{…}}` for engine access | Spreading `motion.div` props on the public API |
| `data-slot="header"` hook | `headerClassNameWithFortyOptions` |

## Reference implementation A — `Reveal` primitive

`packages/motion/src/reveal.tsx` (🔵 planned). CSS + IntersectionObserver by default; escalates to Motion only for springs. SSR-safe, reduced-motion aware, ref-forwarded.

```tsx
"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: "sm" | "md" | "lg";
  duration?: "instant" | "fast" | "normal" | "slow";
  delay?: "none" | "sm" | "md";
  trigger?: "mount" | "in-view";
  once?: boolean;
  viewportMargin?: string;
  reducedMotion?: "respect" | "force-reduce" | "allow";
  onVisibilityChange?: (visible: boolean) => void;
  asChild?: boolean;
}

const DIST: Record<NonNullable<RevealProps["distance"]>, string> = {
  sm: "var(--motion-distance-sm)", md: "var(--motion-distance-md)", lg: "var(--motion-distance-lg)",
};

export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { direction = "up", distance = "md", duration = "normal", delay = "none",
    trigger = "in-view", once = true, viewportMargin = "0px 0px -10% 0px",
    reducedMotion = "respect", onVisibilityChange, className, style, children, ...rest }, ref) {

  const innerRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
  const [shown, setShown] = React.useState(trigger === "mount");

  React.useEffect(() => {
    if (trigger !== "in-view") { setShown(true); return; }
    const el = innerRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); onVisibilityChange?.(true); if (once) io.disconnect(); }
      else if (!once) { setShown(false); onVisibilityChange?.(false); }
    }, { rootMargin: viewportMargin });
    io.observe(el);
    return () => io.disconnect();            // cleanup: no leaked observer
  }, [trigger, once, viewportMargin, onVisibilityChange]);

  const sign = direction === "down" || direction === "right" ? "" : "-";
  const offset = direction === "none" ? "0" : `${sign}${DIST[distance]}`;

  return (
    <div
      ref={innerRef}
      data-motion={shown ? "shown" : "hidden"}
      data-reduced-motion={reducedMotion}
      className={cn("scope-reveal", className)}
      style={{
        ["--reveal-offset" as string]: offset,
        ["--reveal-duration" as string]: `var(--motion-duration-${duration})`,
        ["--reveal-delay" as string]: `var(--motion-duration-${delay === "none" ? "instant" : delay})`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});
```

Companion CSS (in `@scope/styles` + the Tailwind preset — reduced motion neutralizes transform/opacity):
```css
.scope-reveal { opacity: 0; transform: translate3d(0, var(--reveal-offset), 0);
  transition: opacity var(--reveal-duration) var(--motion-ease-standard) var(--reveal-delay),
              transform var(--reveal-duration) var(--motion-ease-emphasized) var(--reveal-delay);
  will-change: opacity, transform; }
.scope-reveal[data-motion="shown"] { opacity: 1; transform: translate3d(0,0,0); }
@media (prefers-reduced-motion: reduce) {
  .scope-reveal:not([data-reduced-motion="allow"]) { opacity: 1; transform: none; transition: none; } }
.scope-reveal[data-reduced-motion="force-reduce"] { opacity: 1; transform: none; transition: none; }
```

## Reference implementation B — `AnimatedDialog` component

`packages/react/src/dialog.tsx` (🔵 planned). Built on **Radix** (focus trap, escape, ARIA), Motion for enter/exit, reduced-motion aware.

```tsx
"use client";
import * as React from "react";
import * as RD from "@radix-ui/react-dialog";
import { AnimatePresence, m, LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import { cn } from "@scope/tokens/cn";

export interface AnimatedDialogProps {
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (o: boolean) => void;
  trigger?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode;
  children?: React.ReactNode; className?: string;
  motionProps?: React.ComponentProps<typeof m.div>; // Level-3 escape hatch (advanced, unstable)
}

export function AnimatedDialog({ open, defaultOpen, onOpenChange, trigger, title,
  description, children, className, motionProps }: AnimatedDialogProps) {
  const reduce = useReducedMotion();
  const anim = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 4 }, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } };

  return (
    <RD.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <RD.Trigger asChild>{trigger}</RD.Trigger>}
      <AnimatePresence>
        <RD.Portal forceMount>
          <RD.Overlay asChild forceMount>
            <m.div className="scope-dialog-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          </RD.Overlay>
          <RD.Content asChild forceMount>
            <LazyMotion features={domAnimation} strict>
              <m.div {...anim} {...motionProps}
                data-reduced-motion={reduce ? "reduce" : "no-preference"}
                className={cn("scope-dialog-content", className)}>
                <RD.Title className="scope-dialog-title">{title}</RD.Title>
                {description && <RD.Description className="scope-dialog-desc">{description}</RD.Description>}
                {children}
                <RD.Close aria-label="Close" className="scope-dialog-close">×</RD.Close>
              </m.div>
            </LazyMotion>
          </RD.Content>
        </RD.Portal>
      </AnimatePresence>
    </RD.Root>
  );
}
```

Radix supplies keyboard, focus trap+restore, `aria-modal`, and labelling; reduced motion collapses to a plain fade; `motionProps` is the documented advanced hatch. Required tests and DoD: [`14`](14-testing-strategy.md), [`25`](25-definition-of-done.md).
