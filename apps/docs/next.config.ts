import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@scope/react", "@scope/motion", "@scope/sections", "@scope/tokens"],
  // Serve registry items at an extensionless path so the shadcn install command shows no
  // `.json` and needs no namespace setup: `npx shadcn add https://motiq.dev/r/<name>`.
  // Returned as a plain array (afterFiles), so the static /r/<name>.json is served directly
  // and only the extensionless /r/<name> falls through to this rewrite.
  async rewrites() {
    return [{ source: "/r/:name", destination: "/r/:name.json" }];
  },
};

export default config;
