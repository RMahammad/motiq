import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

const SANS_NAME = "Motiq Geist";
const MONO_NAME = "Motiq Geist Mono";

export const sansFamily = `"${SANS_NAME}", ui-sans-serif, system-ui, sans-serif`;
export const monoFamily = `"${MONO_NAME}", ui-monospace, monospace`;

/** Load a vendored variable font and block capture until Chromium has it ready. */
const loadLocalFont = (family: string, file: string): void => {
  if (typeof document === "undefined" || typeof FontFace === "undefined") return;

  const handle = delayRender(`Loading local font ${family}`);
  const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {
    style: "normal",
    weight: "100 900",
  });

  face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      continueRender(handle);
    })
    .catch((error: unknown) => {
      cancelRender(error instanceof Error ? error : new Error(`Unable to load ${family}`));
    });
};

loadLocalFont(SANS_NAME, "fonts/geist-latin.woff2");
loadLocalFont(MONO_NAME, "fonts/geist-mono-latin.woff2");
