"use client";

import * as React from "react";

import { CardStackDeck, type CardStackDeckItem } from "@/registry/creative/card-stack-deck";
import { ControlBar, ControlDivider, ControlHint, ControlSegmented, ControlToggle } from "../_components/preview-controls";

const CATEGORIES = [
  { id: "backgrounds", name: "Backgrounds", count: 27, from: "#4f7cff", to: "#22c7d9" },
  { id: "cards", name: "Cards & Surfaces", count: 14, from: "#22c7d9", to: "#7ff0d3" },
  { id: "navigation", name: "Navigation", count: 11, from: "#315fea", to: "#4f7cff" },
  { id: "forms", name: "Forms & Inputs", count: 19, from: "#4f7cff", to: "#9ce8b5" },
  { id: "data", name: "Data Display", count: 16, from: "#22c7d9", to: "#4f7cff" },
] as const;

const ITEMS: CardStackDeckItem[] = CATEGORIES.map((c) => ({
  id: c.id,
  label: c.name,
  content: (
    <>
      <div className="relative h-[74px] shrink-0" style={{ background: `linear-gradient(120deg, ${c.from}, ${c.to})` }}>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, var(--color-surface), transparent 60%)" }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-[18px] pb-4 pt-3.5">
        <span className="text-[16px] font-semibold tracking-tight text-[var(--color-fg)]">{c.name}</span>
        <span className="font-mono text-[11px] text-[var(--color-muted)]">{c.count} components · MIT</span>
        <span className="mt-auto truncate font-mono text-[10px] text-[var(--color-accent-text)]">
          npx shadcn add @motiq/{c.id}
        </span>
      </div>
    </>
  ),
}));

export function CardStackDeckPreview() {
  const [topIndex, setTopIndex] = React.useState(0);
  const [drag, setDrag] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [arc, setArc] = React.useState("210");

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-10">
        <div className="w-full max-w-[320px]">
          <CardStackDeck
            items={ITEMS}
            topIndex={topIndex}
            onTopChange={setTopIndex}
            arcWidth={Number(arc)}
            dragToShuffle={drag}
            reducedMotion={!motion || undefined}
            label="Motiq category deck"
          />
        </div>
      </div>

      <ControlBar label="Deck controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Arc</span>
        <ControlSegmented
          label="Arc width"
          value={arc}
          onChange={setArc}
          options={[
            { value: "120", label: "Tight" },
            { value: "210", label: "Signature" },
            { value: "300", label: "Wide" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={drag} onPressedChange={setDrag}>
          Drag to shuffle
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        {/* The deck owns the aria-live announcement; this is a visual echo only. */}
        <ControlHint>Front card: {CATEGORIES[topIndex % CATEGORIES.length].name}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default CardStackDeckPreview;
