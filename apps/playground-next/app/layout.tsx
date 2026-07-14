import type { ReactNode } from "react";
// Token vars + component CSS from the library (non-Tailwind consumer path).
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/react/styles.css";
import "@scope/sections/styles.css";

export const metadata = { title: "Playground — Next App Router" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
