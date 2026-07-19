// Brand values mirrored from packages/tokens/styles.css (dark theme) and
// product.config.json. Kept as constants because this internal tool is
// intentionally isolated from the workspace packages.

export const brand = {
  name: "Motiq",
  tagline: "Animated React & shadcn components, installable as editable source.",
  domain: "motiq.dev",
  github: "github.com/RMahammad/motiq",
} as const;

export const colors = {
  bg: "#080c14",
  bgElevated: "#0d1420",
  surface: "#111827",
  surfaceRaised: "#192337",
  surfaceStrong: "#243249",
  border: "#263449",
  borderStrong: "#354863",
  fg: "#f8fafc",
  fgSecondary: "#cbd5e1",
  muted: "#9caabd",
  accent: "#4f7cff",
  accentHover: "#6f91ff",
  accentText: "#7f9fff",
  accentSoft: "rgba(79, 124, 255, 0.14)",
  success: "#34d399",
  amber: "#fbbf24",
} as const;

export const fontFamily = "'Inter', sans-serif";
export const monoFamily = "'JetBrains Mono', monospace";
