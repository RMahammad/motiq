import boundaries from "@scope/eslint-config/boundaries";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
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
