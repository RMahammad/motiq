"use client";

import * as React from "react";
import { animate } from "motion/mini";
import type { AnimationPlaybackControls } from "motion";

import { cn } from "@/lib/utils";

type PlayMode = "in-view" | "mount" | "controlled";
type Speed = "slow" | "normal" | "fast";
type EmphasisStyle = "underline" | "none";

export interface KineticEmphasisProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The sentence, with emphasis authored as real `<em>` / `<strong>` children:
   * `<KineticEmphasis>Motion that <em>understands emphasis</em>.</KineticEmphasis>`
   */
  children: React.ReactNode;
  /** Element tag to render. */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  /** When the sweep plays. `controlled` plays on each rising edge of `active`. */
  play?: PlayMode;
  /** For `play="controlled"`. */
  active?: boolean;
  /** Stagger/duration preset. */
  speed?: Speed;
  /** 0–1 intensity of the decaying activation trace behind the front. */
  trail?: number;
  /** Persistent treatment for emphasized phrases after ignition. */
  emphasisStyle?: EmphasisStyle;
  /** Force reduced motion (e.g. from a preview toggle). Defaults to the user's OS preference. */
  reducedMotion?: boolean;
  /** Fires once per completed sweep. */
  onComplete?: () => void;
}

interface Seg {
  text: string;
  em: boolean;
}

const SPEEDS: Record<Speed, { stagger: number; duration: number }> = {
  slow: { stagger: 0.11, duration: 0.6 },
  normal: { stagger: 0.08, duration: 0.5 },
  fast: { stagger: 0.055, duration: 0.38 },
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SOFT_WORD_CAP = 40;

/** Accent used AS text — resolves to a contrast-safe token (≥4.5:1 at body sizes). */
const ACCENT_TEXT = "var(--ke-accent, var(--color-accent-text, var(--color-accent, #5648ee)))";
/** Accent used decoratively (underline wash, traces) — may stay vivid. */
const ACCENT_DECOR = "var(--ke-accent, var(--color-accent, #695cff))";

/** Flatten string content of an em/strong element. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

function segment(children: React.ReactNode): { segs: Seg[]; unsupported: boolean } {
  const segs: Seg[] = [];
  let unsupported = false;
  // Punctuation touching a boundary (e.g. `<em>emphasis</em>,`) must attach to
  // the previous word instead of becoming an orphan token with a space before it.
  let midWord = false;
  const pushTokens = (raw: string, em: boolean) => {
    if (!raw) return;
    const startsWithSpace = /^\s/.test(raw);
    const tokens = raw.split(/\s+/).filter(Boolean);
    tokens.forEach((t, idx) => {
      if (idx === 0 && !startsWithSpace && midWord && segs.length > 0) {
        segs[segs.length - 1].text += t;
      } else {
        segs.push({ text: t, em });
      }
    });
    midWord = tokens.length > 0 && !/\s$/.test(raw);
  };
  const walk = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (child == null || typeof child === "boolean") return;
      if (typeof child === "string" || typeof child === "number") {
        pushTokens(String(child), false);
        return;
      }
      if (React.isValidElement(child)) {
        const props = child.props as { children?: React.ReactNode };
        if (child.type === React.Fragment) {
          walk(props.children);
          return;
        }
        if (child.type === "em" || child.type === "strong") {
          pushTokens(textOf(props.children), true);
          return;
        }
      }
      unsupported = true;
      midWord = false;
    });
  };
  walk(children);
  return { segs, unsupported };
}

/**
 * KineticEmphasis — reading emphasis that physically travels through the copy.
 *
 * An activation front sweeps the sentence in reading order; each word lifts from
 * a muted state to full contrast leaving a decaying accent trace, and phrases
 * marked with real `<em>`/`<strong>` ignite — in sync with the front — into a
 * persistent accent + underline treatment that remains as designed typography.
 *
 * Server markup, no-JS, and reduced motion all render the FINAL designed state
 * (never hidden content); the pre-animation state is applied client-side only.
 * Screen readers get the original children (with native emphasis semantics)
 * exactly once; the animated layer is aria-hidden and not selectable.
 *
 * Theming: `--ke-accent`, `--ke-muted` (fall back to `--color-accent` /
 * `--color-muted` semantic tokens). Clean-room original.
 */
export function KineticEmphasis({
  children,
  as: Tag = "p",
  play = "in-view",
  active,
  speed = "normal",
  trail = 0.6,
  emphasisStyle = "underline",
  reducedMotion,
  onComplete,
  className,
  style,
  ...rest
}: KineticEmphasisProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const controlsRef = React.useRef<AnimationPlaybackControls[]>([]);
  const playedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const { segs, unsupported } = React.useMemo(() => segment(children), [children]);
  const trailAmount = Math.min(1, Math.max(0, trail));
  const preset = SPEEDS[speed];

  // Misuse warnings (fire only on actual misuse; no process.env so the
  // installed source typechecks in browser-only projects without node types).
  React.useEffect(() => {
    if (unsupported) {
      console.warn(
        "[KineticEmphasis] Only strings and <em>/<strong> children are animated; other elements were ignored in the animated layer (the accessible layer still renders them).",
      );
    }
    if (segs.length > SOFT_WORD_CAP) {
      console.warn(
        `[KineticEmphasis] ${segs.length} words exceeds the recommended cap of ${SOFT_WORD_CAP}; consider a shorter passage for a legible sweep.`,
      );
    }
  }, [unsupported, segs.length]);

  const prefersReduced = useReducedMotionPref();
  const reduce = reducedMotion ?? prefersReduced;

  const applyInitial = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-ke-word]").forEach((el) => {
      el.style.opacity = "0.35";
      el.style.transform = "translateY(0.38em)";
      el.style.color = "var(--ke-muted, var(--color-muted, #8a8f98))";
    });
    root.querySelectorAll<HTMLElement>("[data-ke-trace]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "scaleX(0.4)";
    });
    root.querySelectorAll<HTMLElement>("[data-ke-underline]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "scaleX(0)";
    });
  }, []);

  const clearInline = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root
      .querySelectorAll<HTMLElement>("[data-ke-word], [data-ke-trace], [data-ke-underline]")
      .forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
        // Restore the DESIGNED rest state: emphasis keeps its accent (React
        // set it as an inline style, so removing it would strip the design
        // under reduced motion — see independent review, major #1).
        if (el.dataset.keWord === "em") el.style.color = ACCENT_TEXT;
        else el.style.removeProperty("color");
      });
  }, []);

  const sweep = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    // No WAAPI (very old browsers, some test environments): settle in the
    // final designed state instead of animating.
    if (typeof root.animate !== "function") {
      clearInline();
      playedRef.current = true;
      onCompleteRef.current?.();
      return;
    }
    // interruption-safe: cancel any in-flight sweep, then restart deterministically
    controlsRef.current.forEach((c) => c.cancel());
    controlsRef.current = [];
    applyInitial();

    const { stagger, duration } = preset;
    const controls: AnimationPlaybackControls[] = [];
    const words = Array.from(root.querySelectorAll<HTMLElement>("[data-ke-word]"));

    words.forEach((word, i) => {
      const em = word.dataset.keWord === "em";
      const delay = 0.05 + i * stagger;
      const fg = "var(--ke-fg, currentColor)";
      const accent = ACCENT_TEXT;

      controls.push(
        animate(
          word,
          em
            ? {
                opacity: 1,
                transform: ["translateY(0.38em) scale(1)", "translateY(0) scale(1.03)", "translateY(0) scale(1)"],
                color: accent,
              }
            : { opacity: 1, transform: "translateY(0)", color: fg },
          { delay, duration: em ? duration * 1.3 : duration, ease: EASE_OUT },
        ),
      );

      const trace = word.parentElement?.querySelector<HTMLElement>("[data-ke-trace]");
      if (trace && !em && trailAmount > 0) {
        controls.push(
          animate(
            trace,
            { opacity: [0, 0.9 * trailAmount, 0], transform: ["scaleX(0.4)", "scaleX(1)", "scaleX(1)"] },
            { delay, duration: 0.45 + 0.35 * trailAmount, ease: "easeOut" },
          ),
        );
      }
      const underline = word.parentElement?.querySelector<HTMLElement>("[data-ke-underline]");
      if (underline && em) {
        // ignition is causally tied to the front reaching this word
        controls.push(
          animate(
            underline,
            { opacity: 1, transform: "scaleX(1)" },
            { delay: delay + duration * 0.3, duration: 0.5, ease: EASE_OUT },
          ),
        );
      }
    });

    controlsRef.current = controls;
    Promise.all(controls.map((c) => c.finished.catch(() => {}))).then(() => {
      // only a sweep that was not superseded/cancelled counts as played
      // (Strict Mode double-effects cancel the first run; it must not count)
      if (controlsRef.current === controls) {
        playedRef.current = true;
        onCompleteRef.current?.();
      }
    });
  }, [applyInitial, clearInline, preset, trailAmount]);

  // Mount/in-view orchestration. Layout effect so the muted initial state is
  // applied before first client paint (the server paints the final state).
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || segs.length === 0) return;
    if (reduce) {
      controlsRef.current.forEach((c) => c.cancel());
      controlsRef.current = [];
      clearInline();
      return;
    }
    if (play === "mount") {
      if (playedRef.current) {
        clearInline(); // props changed after a completed sweep — rest in the final state
        return;
      }
      sweep();
      return () => controlsRef.current.forEach((c) => c.cancel());
    }
    if (play === "in-view") {
      if (playedRef.current) {
        clearInline(); // already played to completion — keep the designed rest state
        return;
      }
      if (typeof IntersectionObserver === "undefined") {
        sweep();
        return () => controlsRef.current.forEach((c) => c.cancel());
      }
      applyInitial();
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting) && !playedRef.current) {
            sweep();
            io.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      io.observe(root);
      return () => {
        io.disconnect();
        controlsRef.current.forEach((c) => c.cancel());
      };
    }
    return () => controlsRef.current.forEach((c) => c.cancel());
  }, [play, reduce, segs.length, sweep, applyInitial, clearInline]);

  // controlled mode: play on each rising edge of `active`
  const prevActive = React.useRef(false);
  React.useEffect(() => {
    if (play !== "controlled" || reduce) return;
    if (active && !prevActive.current) sweep();
    prevActive.current = !!active;
  }, [play, active, reduce, sweep]);

  const underlineOn = emphasisStyle === "underline";

  return (
    <Tag ref={rootRef as React.Ref<never>} className={cn("ke-root", className)} style={style} {...rest}>
      {/* Accessible layer: the original children exactly once, native semantics intact. */}
      <span className="sr-only">{children}</span>
      {/* Animated layer: decorative, hidden from AT, excluded from selection/copy. */}
      <span aria-hidden="true" className="select-none">
        {segs.map((seg, i) => {
          const WordTag = seg.em ? "em" : "span";
          // bridge the inter-word gap so a multi-word phrase reads as one underline
          const joinRight = seg.em && segs[i + 1]?.em;
          return (
            <React.Fragment key={i}>
            <span className="relative inline-block whitespace-pre align-baseline">
              <WordTag
                data-ke-word={seg.em ? "em" : "word"}
                className={cn(
                  "relative inline-block not-italic [will-change:transform,opacity]",
                  seg.em && "font-semibold forced-colors:underline",
                )}
                style={seg.em ? { color: ACCENT_TEXT } : undefined}
              >
                {/* the phrase's inter-word space lives INSIDE the <em> so the
                    underline (and forced-colors text-decoration) is continuous */}
                {joinRight ? `${seg.text} ` : seg.text}
              </WordTag>
              {seg.em && underlineOn ? (
                <span
                  data-ke-underline
                  className="absolute left-0 -bottom-[0.06em] h-[0.075em] origin-left rounded-full forced-colors:hidden"
                  style={{
                    right: 0,
                    // middle words of a phrase stay solid; only the last fades out
                    background: joinRight
                      ? ACCENT_DECOR
                      : `linear-gradient(90deg, ${ACCENT_DECOR}, color-mix(in oklab, ${ACCENT_DECOR} 45%, transparent))`,
                    boxShadow: `0 0 12px color-mix(in oklab, ${ACCENT_DECOR} 55%, transparent)`,
                  }}
                />
              ) : null}
              {!seg.em ? (
                <span
                  data-ke-trace
                  className="absolute inset-x-0 -bottom-[0.06em] h-[0.075em] origin-left rounded-full opacity-0 forced-colors:hidden"
                  style={{ background: ACCENT_DECOR }}
                />
              ) : null}
            </span>
            {i < segs.length - 1 && !joinRight ? " " : null}
            </React.Fragment>
          );
        })}
      </span>
    </Tag>
  );
}

function useReducedMotionPref(): boolean {
  // Lazy synchronous read so a reduced-motion user never sees a sweep start
  // before the preference lands (the value is never rendered into markup, so
  // there is no hydration-mismatch risk).
  const [reduced, setReduced] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default KineticEmphasis;
