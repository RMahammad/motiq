// Import-boundary firewall — the deterministic enforcement of docs/03-architecture.md.
// Consumed by the root eslint.config.js. See docs/24-claude-code-workflow.md (layering rule).
import tseslint from "typescript-eslint";

/** Forbidden in every core UI package (react, motion, sections). */
const FORBIDDEN_IN_CORE = [
  {
    group: ["@scope/remotion", "@scope/remotion/*"],
    message: "Boundary: core UI must not import Remotion (docs/03-architecture.md).",
  },
  {
    group: ["node:*"],
    message: "Boundary: core UI must not import Node built-ins (docs/03-architecture.md).",
  },
  {
    group: ["next", "next/*"],
    message: "Boundary: core UI must not import next/* (docs/03-architecture.md).",
  },
];

export default tseslint.config(
  {
    files: ["packages/react/src/**/*.{ts,tsx}", "packages/sections/src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": ["error", { patterns: FORBIDDEN_IN_CORE }],
    },
  },
  {
    // @scope/motion has all core bans PLUS it may not import the components package.
    files: ["packages/motion/src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...FORBIDDEN_IN_CORE,
            {
              group: ["@scope/react", "@scope/react/*"],
              message: "Boundary: @scope/motion must not import @scope/react (docs/03).",
            },
          ],
        },
      ],
    },
  },
  {
    // @scope/tokens imports nothing internal.
    files: ["packages/tokens/src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@scope/*"],
              message: "Boundary: @scope/tokens must not import other internal packages (docs/03).",
            },
            ...FORBIDDEN_IN_CORE,
          ],
        },
      ],
    },
  },
);
