"use client";

/**
 * LAB — Kinetic Emphasis concept comparison (not linked from nav, not a product page).
 * Three meaningfully different visual concepts for the signature text component,
 * rendered for screenshot comparison per the three-concepts rule.
 */
import * as React from "react";
import { motion } from "motion/react";

const COPY: Array<{ text: string; em?: boolean }> = [
  { text: "Motion" },
  { text: "that" },
  { text: "understands" },
  { text: "emphasis," , em: false },
  { text: "not" },
  { text: "just" },
  { text: "easing." },
];
// emphasis phrase = "understands emphasis,"
const EM = new Set([2, 3]);

const headline =
  "text-balance text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.12] tracking-tight text-[var(--color-fg)]";

function Stage({
  label,
  blurb,
  children,
  onReplay,
}: {
  label: string;
  blurb: string;
  children: React.ReactNode;
  onReplay: () => void;
}) {
  return (
    <section
      data-concept={label}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
    >
      <div
        className="relative flex min-h-[340px] items-center px-8 py-14 sm:px-14"
        style={{
          background:
            "radial-gradient(120% 130% at 50% -10%, color-mix(in oklab, var(--color-accent) 10%, var(--color-surface)) 0%, var(--color-surface) 58%)",
        }}
      >
        <div className="w-full max-w-[720px]">{children}</div>
      </div>
      <div className="flex items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
        <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[12px] font-semibold text-[var(--color-fg)]">
          Concept {label}
        </span>
        <span className="text-[12px] text-[var(--color-muted)]">{blurb}</span>
        <button
          type="button"
          onClick={onReplay}
          className="ml-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)]"
        >
          Replay
        </button>
      </div>
    </section>
  );
}

/* Concept A — “Reading current”: reading-order activation with a decaying accent
   trace; emphasis ignites into a persistent underline wash. */
function ConceptA() {
  return (
    <h2 className={headline} aria-label="Motion that understands emphasis, not just easing.">
      {COPY.map((w, i) => {
        const em = EM.has(i);
        return (
          <span key={i} aria-hidden className="relative inline-block whitespace-pre">
            <motion.span
              className="relative inline-block"
              initial={{ opacity: 0.35, y: "0.4em", color: "var(--color-muted)" }}
              animate={{
                opacity: 1,
                y: 0,
                color: em ? "var(--color-accent)" : "var(--color-fg)",
                scale: em ? [1, 1.035, 1] : 1,
              }}
              transition={{ delay: 0.15 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {w.text}
            </motion.span>
            {/* activation trace: peaks then decays; persists for emphasis */}
            <motion.span
              className="absolute inset-x-0 -bottom-[0.08em] h-[0.09em] rounded-full"
              style={{
                background: em
                  ? "linear-gradient(90deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 45%, transparent))"
                  : "var(--color-accent)",
                boxShadow: "0 0 12px color-mix(in oklab, var(--color-accent) 55%, transparent)",
                transformOrigin: "left",
              }}
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: em ? [0, 1, 1] : [0, 0.9, 0], scaleX: 1 }}
              transition={{ delay: 0.15 + i * 0.09, duration: em ? 0.8 : 0.75, ease: "easeOut" }}
            />
            {" "}
          </span>
        );
      })}
    </h2>
  );
}

/* Concept B — “Depth settle”: emphasis converges to the front plane first and
   ignites; the rest of the sentence settles in behind it, in reading order. */
function ConceptB() {
  return (
    <h2
      className={headline}
      aria-label="Motion that understands emphasis, not just easing."
      style={{ perspective: 600 }}
    >
      {COPY.map((w, i) => {
        const em = EM.has(i);
        const delay = em ? 0.1 + (i === 2 ? 0 : 0.08) : 0.75 + i * 0.07;
        return (
          <span key={i} aria-hidden className="relative inline-block whitespace-pre">
            <motion.span
              className="relative inline-block"
              initial={{
                opacity: em ? 0 : 0.18,
                scale: em ? 1.28 : 0.94,
                y: em ? "-0.15em" : "0.12em",
                color: "var(--color-muted)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                color: em ? "var(--color-fg)" : "var(--color-fg)",
              }}
              transition={{ delay, duration: em ? 0.65 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {em ? (
                <span className="relative isolate">
                  <motion.span
                    className="absolute -inset-x-[0.12em] -inset-y-[0.04em] -z-10 rounded-[0.3em]"
                    style={{
                      background:
                        "color-mix(in oklab, var(--color-accent) 22%, transparent)",
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.35, duration: 0.5, ease: "easeOut" }}
                  />
                  {w.text}
                </span>
              ) : (
                w.text
              )}
            </motion.span>
            {" "}
          </span>
        );
      })}
    </h2>
  );
}

/* Concept C — “Editorial markup”: masked baseline rise per word, then an
   editor’s highlighter draws across the emphasis phrase and a rule underlines
   the headline. Print-editorial feel. */
function ConceptC() {
  return (
    <div>
      <h2 className={headline} aria-label="Motion that understands emphasis, not just easing.">
        {COPY.map((w, i) => {
          const em = EM.has(i);
          return (
            <span key={i} aria-hidden className="relative inline-block overflow-hidden whitespace-pre pb-[0.12em] align-bottom">
              <motion.span
                className="relative inline-block"
                initial={{ y: "112%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                {em ? (
                  <span className="relative isolate">
                    <motion.span
                      className="absolute -inset-x-[0.1em] top-[0.5em] -bottom-[0.02em] -z-10 origin-left"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--color-accent) 30%, transparent) 30%)",
                        transform: "skewX(-6deg)",
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.95, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {w.text}
                  </span>
                ) : (
                  w.text
                )}
              </motion.span>
              {" "}
            </span>
          );
        })}
      </h2>
      <motion.div
        aria-hidden
        className="mt-5 h-px origin-left"
        style={{ background: "color-mix(in oklab, var(--color-fg) 25%, transparent)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.p
        className="mt-4 text-[14px] text-[var(--color-muted)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        The editor’s pass — reveal, then mark what matters.
      </motion.p>
    </div>
  );
}

export default function Page() {
  const [a, setA] = React.useState(0);
  const [b, setB] = React.useState(0);
  const [c, setC] = React.useState(0);
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-6 py-14">
      <header>
        <h1 className="text-xl font-semibold text-[var(--color-fg)]">Kinetic Emphasis — concept lab</h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted)]">
          Three-concepts rule: compare composition, motion, sequencing, and surface treatment before implementation.
        </p>
      </header>
      <Stage
        label="A"
        blurb="Reading current — reading-order activation, decaying trace, emphasis ignites a persistent underline."
        onReplay={() => setA((n) => n + 1)}
      >
        <div key={a}>
          <ConceptA />
        </div>
      </Stage>
      <Stage
        label="B"
        blurb="Depth settle — emphasis converges to the front plane first; the sentence settles in behind it."
        onReplay={() => setB((n) => n + 1)}
      >
        <div key={b}>
          <ConceptB />
        </div>
      </Stage>
      <Stage
        label="C"
        blurb="Editorial markup — masked baseline rise, then a highlighter marks the phrase and a rule draws."
        onReplay={() => setC((n) => n + 1)}
      >
        <div key={c}>
          <ConceptC />
        </div>
      </Stage>
    </main>
  );
}
