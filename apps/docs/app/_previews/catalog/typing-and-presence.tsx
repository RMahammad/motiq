"use client";

import * as React from "react";

import { TypingAndPresence, type Participant } from "@/registry/communication/typing-and-presence";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL TypingAndPresence in its
 * elevated "floating-panel" mode — a populated participant list with mixed presence
 * and one person actively typing, so the card reads as a live channel. No demo
 * control panel (Add / Start typing / Reconnect / mode + density toggles).
 */

/* Clearly fictional demo — a design-team messaging workspace. No real people. */
const PARTICIPANTS: Participant[] = [
  { id: "jamie", displayName: "Jamie Okafor", presenceState: "online", color: "#7c5cff", role: "Owner", typingState: "typing", activeContext: "#redesign" },
  { id: "morgan", displayName: "Morgan Diaz", presenceState: "active", color: "#0ea5a0", activeContext: "#redesign" },
  { id: "ada", displayName: "Ada Lindqvist", presenceState: "online", color: "#f59e0b", activeContext: "spec.fig" },
  { id: "rin", displayName: "Rin Nakamura", presenceState: "idle", color: "#ef4468", activeContext: "#redesign" },
  { id: "sasha", displayName: "Sasha Bauer", presenceState: "away", color: "#3b82f6" },
];

export function TypingAndPresenceCatalogPreview() {
  return (
    <div className="mx-auto flex w-full max-w-[460px] justify-center">
      <TypingAndPresence participants={PARTICIPANTS} context="#redesign" mode="floating-panel" maxVisible={5} />
    </div>
  );
}

export default TypingAndPresenceCatalogPreview;
