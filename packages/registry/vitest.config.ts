import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/lib/utils": new URL("./registry/lib/utils.ts", import.meta.url).pathname,
      "@/lib/motionstack": new URL("./registry/lib/motion.ts", import.meta.url).pathname,
      "@/components/motionstack/kpi-number-morph": new URL("./registry/data/kpi-number-morph.tsx", import.meta.url).pathname,
      "@/components/motionstack/data-refresh-state": new URL("./registry/data/data-refresh-state.tsx", import.meta.url).pathname,
      "@/components/motionstack/streaming-data-rows": new URL("./registry/data/streaming-data-rows.tsx", import.meta.url).pathname,
      "@/components/motionstack/filter-result-transition": new URL("./registry/data/filter-result-transition.tsx", import.meta.url).pathname,
      "@/components/motionstack/agent-run-timeline": new URL("./registry/ai/agent-run-timeline.tsx", import.meta.url).pathname,
      "@/components/motionstack/tool-call-activity": new URL("./registry/ai/tool-call-activity.tsx", import.meta.url).pathname,
      "@/components/motionstack/source-citation-rail": new URL("./registry/ai/source-citation-rail.tsx", import.meta.url).pathname,
      "@/components/motionstack/prompt-composer": new URL("./registry/ai/prompt-composer.tsx", import.meta.url).pathname,
      "@/components/motionstack/environment-switcher": new URL("./registry/developer-tools/environment-switcher.tsx", import.meta.url).pathname,
      "@/components/motionstack/deployment-pipeline": new URL("./registry/developer-tools/deployment-pipeline.tsx", import.meta.url).pathname,
      "@/components/motionstack/live-log-stream": new URL("./registry/developer-tools/live-log-stream.tsx", import.meta.url).pathname,
      "@/components/motionstack/api-request-inspector": new URL("./registry/developer-tools/api-request-inspector.tsx", import.meta.url).pathname,
      "@/components/motionstack/live-presence-stack": new URL("./registry/collaboration/live-presence-stack.tsx", import.meta.url).pathname,
      "@/components/motionstack/activity-stream": new URL("./registry/collaboration/activity-stream.tsx", import.meta.url).pathname,
      "@/components/motionstack/approval-workflow": new URL("./registry/collaboration/approval-workflow.tsx", import.meta.url).pathname,
      "@/components/motionstack/comment-thread": new URL("./registry/collaboration/comment-thread.tsx", import.meta.url).pathname,
      "@/components/motionstack/typing-and-presence": new URL("./registry/communication/typing-and-presence.tsx", import.meta.url).pathname,
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
