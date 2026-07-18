"use client";

import * as React from "react";

import { MessageDeliveryStates, type DeliveryMessage } from "@/registry/communication/message-delivery-states";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL MessageDeliveryStates as
 * a short conversation showing the delivery-receipt spectrum (read → delivered →
 * sent) with read receipts and an attachment — not an every-state dump, and no
 * demo control panel (Send / Deliver / Fail / Retry / Cancel / Reset). No action
 * handlers are wired, so no Retry/Edit/Copy buttons render.
 */

const MIN = 60_000;
const T0 = 1_800_000_000_000; // fixed reference instant

const ME = { id: "me", name: "You" };
const MIRA = { id: "mira", name: "Mira Delacroix", color: "#7c5cff" };
const DEVON = { id: "devon", name: "Devon Achebe", color: "#0ea5a0" };

const READERS = [
  { id: "mira", name: "Mira Delacroix", color: "#7c5cff" },
  { id: "devon", name: "Devon Achebe", color: "#0ea5a0" },
];

/* Clearly fictional demo — a product team's release-day thread. No real people. */
const MESSAGES: DeliveryMessage[] = [
  {
    id: "d1",
    body: "Release notes are drafted - pushing the changelog to staging now.",
    author: MIRA,
    timestamp: T0 - 12 * MIN,
    deliveryState: "read",
    readRecipients: [{ id: "me", name: "You" }],
  },
  {
    id: "d2",
    body: "On it. Verifying the pricing table renders on mobile before we tag.",
    author: ME,
    timestamp: T0 - 9 * MIN,
    deliveryState: "read",
    readRecipients: READERS,
  },
  {
    id: "d3",
    body: "Screenshot of the annual-toggle truncation attached.",
    author: DEVON,
    timestamp: T0 - 6 * MIN,
    deliveryState: "delivered",
    attachmentState: "uploaded",
    attachmentName: "toggle-mobile.png",
  },
  {
    id: "d4",
    body: "Fix is in. Sending the confirmation to the room.",
    author: ME,
    timestamp: T0 - 1 * MIN,
    deliveryState: "sent",
  },
];

function formatTimestamp(value: DeliveryMessage["timestamp"]): string {
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  const diff = Math.max(0, T0 - ms);
  const m = Math.round(diff / MIN);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function MessageDeliveryStatesCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <MessageDeliveryStates
        messages={MESSAGES}
        currentUserId="me"
        formatTimestamp={formatTimestamp}
        label="Launch room conversation"
        maxHeight={420}
      />
    </div>
  );
}

export default MessageDeliveryStatesCatalogPreview;
