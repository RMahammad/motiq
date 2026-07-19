import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // Stories are co-located with the components (excluded from tsc/vitest/tsdown).
  stories: ["../../../packages/*/src/**/*.stories.tsx"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
