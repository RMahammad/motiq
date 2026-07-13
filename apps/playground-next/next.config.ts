import type { NextConfig } from "next";

// Workspace packages ship pre-built ESM with preserved "use client".
// transpilePackages is the standard, well-supported path for consuming them.
const config: NextConfig = {
  transpilePackages: ["@scope/react", "@scope/motion", "@scope/tokens"],
};

export default config;
