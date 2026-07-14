import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/animated-button.tsx",
    "src/pricing-card.tsx",
    "src/dialog.tsx",
    "src/sheet.tsx",
    "src/tooltip.tsx",
    "src/popover.tsx",
  ],
  format: "esm",
  dts: true,
  clean: true,
  // peers, workspace deps, and Radix stay external (consumer dedupes; keeps our bundle small)
  external: ["react", "react-dom", "react/jsx-runtime", /^@scope\//, /^@radix-ui\//],
});
