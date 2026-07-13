import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/reveal.tsx"],
  format: "esm",
  dts: true,
  clean: true,
  // peers + workspace deps stay external; must NOT be bundled into the library
  external: ["react", "react-dom", "react/jsx-runtime", /^@scope\//],
});
