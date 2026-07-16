import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/lib/utils": new URL("./registry/lib/utils.ts", import.meta.url).pathname,
      "@/lib/motionstack": new URL("./registry/lib/motion.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["registry/**/*.test.{ts,tsx}"],
    // axe runs on large component DOMs; under concurrent load across many files
    // the default 5s timeout flakes. The components pass in isolation — this only
    // gives the axe-heavy interaction tests headroom.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
