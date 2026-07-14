import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@scope/react", "@scope/motion", "@scope/sections", "@scope/tokens"],
};

export default config;
