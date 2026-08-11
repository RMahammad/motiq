import Link from "next/link";

import { product } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import { CodeBlock } from "../../_components/code-block";

export const metadata = pageMetadata({
  title: "Connecting live data",
  description:
    `How to feed real data into ${product.productName}'s live components - streaming responses, sockets, and polling. ` +
    `The components render what your app passes them; they never fetch and never invent content.`,
  path: "/guides/live-data",
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[var(--color-border)] py-8">
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 max-w-[70ch] text-[14.5px] leading-relaxed text-[var(--color-muted)]">{children}</p>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[12.5px] text-[var(--color-code-fg)]">
    {children}
  </code>
);

const STREAMING = `"use client";

import * as React from "react";
import { AiResponseStream, type ResponseSegment, type StreamState } from "@/components/motiq/ai-response-stream";

export function AssistantAnswer({ prompt }: { prompt: string }) {
  const [segments, setSegments] = React.useState<ResponseSegment[]>([]);
  const [state, setState] = React.useState<StreamState>("streaming");

  React.useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setSegments([]);
      setState("streaming");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(\`Chat failed: \${res.status}\`);

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          // Append to the LAST text segment rather than pushing a new one, or every
          // chunk becomes its own paragraph.
          setSegments((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.type === "text") next[next.length - 1] = { ...last, text: last.text + value };
            else next.push({ type: "text", text: value });
            return next;
          });
        }
        setState("complete");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setState("error");
      }
    })();

    return () => controller.abort();
  }, [prompt]);

  return (
    <AiResponseStream
      segments={segments}
      state={state}
      onStop={() => setState("stopped")}
      onRetry={() => setSegments([])}
    />
  );
}`;

const SUBSCRIPTION = `"use client";

import * as React from "react";
import { LiveLogStream, type LogEntry, type LogStreamStatus } from "@/components/motiq/live-log-stream";

const MAX_ROWS = 500; // an unbounded feed will eventually stall the page

export function DeployLogs({ deploymentId }: { deploymentId: string }) {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [status, setStatus] = React.useState<LogStreamStatus>("idle");

  React.useEffect(() => {
    const source = new EventSource(\`/api/deployments/\${deploymentId}/logs\`);
    setStatus("streaming");

    source.onmessage = (event) => {
      const entry = JSON.parse(event.data) as LogEntry;
      // Append — never rebuild the array from scratch, or every row re-animates.
      setEntries((prev) => [...prev, entry].slice(-MAX_ROWS));
    };
    source.onerror = () => setStatus("error");
    source.addEventListener("done", () => {
      setStatus("completed");
      source.close();
    });

    return () => source.close();
  }, [deploymentId]);

  return <LiveLogStream entries={entries} status={status} />;
}`;

const POLLING = `"use client";

import * as React from "react";
import { DataRefreshState, type RefreshState } from "@/components/motiq/data-refresh-state";

export function RevenuePanel() {
  const [state, setState] = React.useState<RefreshState>("idle");
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    setState("refreshing");
    try {
      await fetch("/api/revenue").then((r) => r.json());
      setLastUpdated(Date.now());
      setState("success");
    } catch {
      setState("error");
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return <DataRefreshState state={state} label="Revenue" lastUpdated={lastUpdated} onRefresh={refresh} />;
}`;

const IDENTITY = `// ❌ New object identities every poll — every row animates as if it were new.
setRows(await fetchOrders());

// ✅ Reuse the objects you already have for rows that did not change.
setRows((prev) => {
  const byId = new Map(prev.map((row) => [row.id, row]));
  return fresh.map((row) => {
    const existing = byId.get(row.id);
    return existing && shallowEqual(existing, row) ? existing : row;
  });
});`;

export default function LiveDataGuidePage() {
  return (
    <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
      <header className="mb-2">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Guide</p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Connecting live data
        </h1>
        <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
          Many {product.productName} components animate content as it <em>arrives</em> - a response that types
          itself out, a log that scrolls, a pipeline that advances. That movement comes from your data, not
          from the component. This page is the contract: what the components expect, and how to wire a real
          source to them.
        </p>
      </header>

      <Section id="contract" title="What the components do, and what they never do">
        <P>
          Every live component here is <strong>presentation-only</strong>. It renders exactly the data you pass
          and animates each item as that item appears. It never fetches, never subscribes, and never invents
          content - an assistant response shows tokens your model produced, never filler.
        </P>
        <P>
          The practical consequence surprises people: hand a component a <em>finished</em> array and every item
          appears in the same frame, so it animates once and then sits still. Nothing is broken - there is
          simply nothing arriving. Feed the same array in over time and it comes alive.
        </P>
      </Section>

      <Section id="shapes" title="Two shapes, and that is all">
        <P>
          Whatever the component, the prop you drive is one of two shapes. Recognising which one you are
          holding tells you how to wire it.
        </P>
        <ul className="mb-4 space-y-2 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          <li>
            · <strong>A collection that grows or changes</strong> - <Code>segments</Code>, <Code>entries</Code>,{" "}
            <Code>events</Code>, <Code>messages</Code>, <Code>rows</Code>. Append to it as data arrives.
          </li>
          <li>
            · <strong>A lifecycle that advances</strong> - <Code>state</Code>, <Code>status</Code>,{" "}
            <Code>loading</Code>. Set it from where your request actually is.
          </li>
        </ul>
        <P>
          Most live components take both: the collection carries the content, the lifecycle prop tells the
          component whether more is coming. Each component page documents its own pair under{" "}
          <em>Driving the live data</em>.
        </P>
      </Section>

      <Section id="streaming" title="Streaming a response">
        <P>
          The pattern behind a response that types itself: read the body as a stream and append each chunk to
          the last text segment. The lifecycle prop follows the request - <Code>streaming</Code> while the
          reader is open, <Code>complete</Code> when it closes, <Code>error</Code> if it throws.
        </P>
        <CodeBlock code={STREAMING} />
      </Section>

      <Section id="subscription" title="Sockets and server-sent events">
        <P>
          For a feed you subscribe to rather than read once, append on each message and close the connection
          on unmount. Two things matter: <strong>append, never rebuild</strong> the array (a fresh array of
          fresh objects makes every row animate again), and <strong>cap the length</strong>, because an
          unbounded feed will eventually stall the page.
        </P>
        <CodeBlock code={SUBSCRIPTION} />
      </Section>

      <Section id="polling" title="Polling">
        <P>
          When there is no stream, poll - and let the lifecycle prop carry the truth. Never fake progress: the
          components render an indeterminate state deliberately rather than showing a percentage you invented.
        </P>
        <CodeBlock code={POLLING} />
      </Section>

      <Section id="identity" title="Keep item identity stable">
        <P>
          This is the mistake that produces &ldquo;why does the whole list flash on every update?&rdquo;. Enter
          and exit animations key off item identity, so replacing every object each poll reads as
          &ldquo;everything is new&rdquo;. Reuse the objects that did not change.
        </P>
        <CodeBlock code={IDENTITY} />
      </Section>

      <Section id="prototyping" title="Before you have a backend">
        <P>
          To see the motion while the real source does not exist yet, drive the same props from{" "}
          <Code>useSequence</Code> - included with every component through <Code>@motiq/primitives</Code>. It
          advances an index through a list on a timer; you derive the collection or the phase from that index.
          Every affected component page carries a ready-made snippet under <em>Driving the live data</em>.
        </P>
        <CodeBlock
          code={`import { useSequence } from "@/lib/motiq";

// a collection that grows
const { index } = useSequence(EVENTS, { intervalMs: 900 });
<WebhookEventStream events={EVENTS.slice(0, index + 1)} />

// a lifecycle that advances
const { value: state } = useSequence(["idle", "loading", "success"] as const);
<ApiRequestInspector state={state} response={RESPONSE} />`}
        />
        <P>
          It is for demos, fixtures, and onboarding tours. When the real source lands, delete the hook and set
          the same props from it - the component does not change.
        </P>
      </Section>

      <Section id="etiquette" title="Pausing and reduced motion">
        <P>
          Pair a demo driver with <Code>useVisibilityPause</Code> so it holds position offscreen and in
          background tabs instead of running to the end unseen. Reduced motion needs no work from you: under{" "}
          <Code>prefers-reduced-motion</Code> the components drop per-item motion and show content
          immediately, while your data keeps flowing exactly the same.
        </P>
      </Section>

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)]">Next</h2>
        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-[var(--color-muted)]">
          Each component page lists its exact props and a driver you can paste.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/components"
            className="inline-flex h-10 items-center rounded-[11px] bg-[var(--color-accent)] px-[18px] text-[13.5px] font-semibold text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Browse components
          </Link>
          <Link
            href="/getting-started"
            className="inline-flex h-10 items-center rounded-[11px] border border-[var(--color-border)] px-[18px] text-[13.5px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
          >
            Install guide
          </Link>
        </div>
      </section>
    </div>
  );
}
