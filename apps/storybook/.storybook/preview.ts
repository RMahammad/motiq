import type { Preview } from "@storybook/react";
// Library CSS: token variables + component/primitive/section styles.
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/react/styles.css";
import "@scope/sections/styles.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
