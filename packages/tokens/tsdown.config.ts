import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/cn.ts"],
  format: "esm",
  dts: true,
  clean: true,
  external: ["clsx", "tailwind-merge"],
});
