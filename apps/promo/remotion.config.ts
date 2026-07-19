import path from "node:path";

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// The promo app renders the REAL registry component source. The same "@/lib"
// aliases the registry files use in apps/docs are mapped here for webpack;
// tsconfig.json mirrors them for the typechecker. The config file is compiled
// to CJS by the Remotion CLI (no import.meta), and the CLI always runs from
// this app directory, so cwd is the anchor.
const registryDir = path.resolve(process.cwd(), "..", "..", "packages", "registry", "registry");

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((current) => {
  const withTailwind = enableTailwind(current);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        "@/lib/utils": path.join(registryDir, "lib", "utils.ts"),
        "@/lib/motiq": path.join(registryDir, "lib", "motion.ts"),
        "@/registry": registryDir,
      },
    },
  };
});
