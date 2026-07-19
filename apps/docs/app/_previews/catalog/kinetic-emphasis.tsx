"use client";

import * as React from "react";

import { KineticEmphasis } from "@/registry/text/kinetic-emphasis";

/**
 * Compact catalog adapter (docs/55 §7). One headline rendered with the real
 * KineticEmphasis — a real `<em>` emphasis phrase, in-view play, no speed/trail/
 * underline controls. The reading-order sweep is the whole story on the card.
 */
export function KineticEmphasisCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[640px] text-center">
      <KineticEmphasis
        as="h2"
        play="in-view"
        className="text-balance text-[clamp(1.9rem,4.6vw,3rem)] font-semibold leading-[1.12] tracking-tight text-[var(--color-fg)]"
      >
        Motion that <em>understands emphasis</em>, not just easing.
      </KineticEmphasis>
      <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
        Mark the phrase that matters with a real <code className="font-mono text-[13px]">&lt;em&gt;</code> and the sweep carries attention to it.
      </p>
    </div>
  );
}

export default KineticEmphasisCatalogPreview;
