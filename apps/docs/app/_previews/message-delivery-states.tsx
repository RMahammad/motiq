"use client";

import * as React from "react";

import {
  MessageDeliveryStates,
  type DeliveryMessage,
  type DeliveryState,
} from "@/registry/communication/message-delivery-states";

/* Clearly fictional demo — a product team's release-day thread. No real people.
 * Fixed ids + timestamps so there is no SSR/CSR hydration drift.
 *
 * The PREVIEW (the "app") owns every delivery transition — it drives sending →
 * sent → delivered → read on a timer, flips failures, and cancels scheduled
 * sends. The component only PRESENTS the states it is handed; it never simulates
 * a network itself. */

const MIN = 60_000;
const T0 = 1_800_000_000_000;

const ME = { id: "me", name: "You" };
const MIRA = { id: "mira", name: "Mira Delacroix", color: "#7c5cff" };
const DEVON = { id: "devon", name: "Devon Achebe", color: "#0ea5a0" };

const READERS = [
  { id: "mira", name: "Mira Delacroix", color: "#7c5cff" },
  { id: "devon", name: "Devon Achebe", color: "#0ea5a0" },
];

function seed(): DeliveryMessage[] {
  return [
    {
      id: "d1",
      body: "Release notes are drafted — pushing the changelog to staging now.",
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
    {
      id: "d5",
      body: "Ship announcement — scheduled for the launch window.",
      author: ME,
      timestamp: T0,
      deliveryState: "scheduled",
      scheduledFor: T0 + 45 * MIN,
    },
  ];
}

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function MessageDeliveryStatesPreview() {
  const [messages, setMessages] = React.useState<DeliveryMessage[]>(seed);
  const idRef = React.useRef(0);
  const timers = React.useRef<number[]>([]);

  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const patch = (id: string, next: Partial<DeliveryMessage>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...next } : m)));

  const setState = (id: string, deliveryState: DeliveryState, extra: Partial<DeliveryMessage> = {}) =>
    patch(id, { deliveryState, ...extra });

  const after = (ms: number, fn: () => void) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };

  // Append a new outgoing message and drive it through the delivery lifecycle,
  // exactly as an app would after its own network calls resolve.
  const sendMessage = () => {
    idRef.current += 1;
    const id = `new-${idRef.current}`;
    const msg: DeliveryMessage = {
      id,
      body: "Confirmed — the mobile toggle fix is live on staging. 🚀",
      author: ME,
      timestamp: T0 + idRef.current * MIN,
      deliveryState: "sending",
    };
    setMessages((prev) => [...prev, msg]);
    after(700, () => setState(id, "sent"));
    after(1500, () => setState(id, "delivered"));
    after(2600, () => setState(id, "read", { readRecipients: READERS }));
  };

  // Explicit stepping controls — advance the newest outgoing message by hand.
  const newestOwnId = () => [...messages].reverse().find((m) => m.author.id === ME.id)?.id;

  const deliver = () => {
    const id = newestOwnId();
    if (id) setState(id, "delivered");
  };
  const markRead = () => {
    const id = newestOwnId();
    if (id) setState(id, "read", { readRecipients: READERS });
  };
  const fail = () => {
    const id = newestOwnId();
    if (id) setState(id, "failed", { error: "Connection lost — tap Retry to resend." });
  };
  const retry = () => {
    const id = messages.find((m) => m.deliveryState === "failed")?.id;
    if (!id) return;
    setState(id, "retrying", { error: undefined });
    after(900, () => setState(id, "delivered"));
  };
  const edit = () => {
    const id = newestOwnId();
    if (id) patch(id, { body: "Confirmed — mobile toggle fix is live (edited for clarity).", edited: true, editedAt: T0 + 40 * MIN });
  };
  const cancelScheduled = () => {
    const id = messages.find((m) => m.deliveryState === "scheduled")?.id;
    if (id) setState(id, "cancelled");
  };
  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    idRef.current = 0;
    setMessages(seed());
  };

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      {/* messaging-interface shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
          <span className="flex -space-x-1.5" aria-hidden>
            <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[var(--color-surface)]" style={{ background: "#7c5cff" }}>MD</span>
            <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[var(--color-surface)]" style={{ background: "#0ea5a0" }}>DA</span>
          </span>
          <span className="text-[13px] font-semibold text-[var(--color-fg)]">Launch room · Aurora 2.0</span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            3 online
          </span>
        </div>

        <div className="p-3">
          <MessageDeliveryStates
            messages={messages}
            currentUserId="me"
            maxHeight={420}
            label="Launch room conversation"
            onRetry={retry}
            onCancel={cancelScheduled}
            onEdit={edit}
            onCopy={() => {}}
          />
        </div>
      </div>

      {/* working controls — the app drives every transition */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={sendMessage}>
          Send message
        </button>
        <button type="button" className={control} onClick={deliver}>
          Deliver
        </button>
        <button type="button" className={control} onClick={markRead}>
          Mark read
        </button>
        <button type="button" className={control} onClick={fail}>
          Fail
        </button>
        <button type="button" className={control} onClick={retry}>
          Retry
        </button>
        <button type="button" className={control} onClick={edit}>
          Edit
        </button>
        <button type="button" className={control} onClick={cancelScheduled}>
          Cancel scheduled
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">The app owns delivery — the component presents it</span>
      </div>
    </div>
  );
}

export default MessageDeliveryStatesPreview;
