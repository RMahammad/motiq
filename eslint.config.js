import boundaries from "@scope/eslint-config/boundaries";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/storybook-static/**",
      "**/node_modules/**",
      "**/*.config.{js,ts,mjs}",
      "**/*.test.{ts,tsx}",
      "**/*.ssr.test.{ts,tsx}",
      "**/*.stories.tsx",
      "**/vitest.setup.ts",
      "docs/**",
    ],
  },
  ...boundaries,
];
