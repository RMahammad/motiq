// Design + motion tokens as typed constants. Canonical doc: docs/10-design-tokens.md.
// CSS-variable equivalents live in ./styles.css (generated/authored from the same values).

export const motion = {
  /** milliseconds */
  duration: { instant: 0, fast: 120, normal: 220, slow: 360 },
  /** cubic-bezier control points */
  ease: {
    standard: [0.2, 0, 0, 1],
    emphasized: [0.2, 0, 0, 1],
  },
  /** px */
  distance: { sm: 8, md: 16, lg: 32 },
  /** seconds */
  stagger: { sm: 0.04, md: 0.08 },
  spring: {
    gentle: { stiffness: 200, damping: 30 },
    snappy: { stiffness: 300, damping: 24 },
  },
} as const;

export type MotionTokens = typeof motion;
export type MotionIntensity = "none" | "reduced" | "standard" | "expressive";
