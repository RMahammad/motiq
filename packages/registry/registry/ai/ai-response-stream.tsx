"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motiq";

/**
 * AiResponseStream — renders a streaming assistant response supplied by the
 * parent application (text, fenced code, inline citations, and lifecycle
 * state). It is a *presentation* component: it never talks to a model, never
 * fabricates tokens, and makes no claim about what an AI is "doing" — the app
 * owns the stream and passes the segments + state in.
 *
 * Accessibility: the rendered content is real, readable text (not aria-hidden),
 * so once the response is complete a screen reader reads the whole thing in one
 * pass. A separate polite `role="status"` region announces lifecycle changes
 * (responding / complete / stopped / failed) — never token-by-token, so the
 * live region is not spammed. State is conveyed with icon + label + border, not
 * colour alone, so it survives forced-colors. Stop / Retry / Copy are real
 * <button>s with accessible names and focus-visible rings. Under
 * `prefers-reduced-motion` there is no per-token motion and no caret: content
 * appears immediately. Clean-room original.
 */

export type StreamState = "streaming" | "stopped" | "complete" | "error";

/** A source referenced by inline `[n]` citation markers. */
export interface StreamSource {
  /** Stable id referenced by a `citation` segment's `sourceId` (e.g. "1"). */
  id: string;
  /** Human-readable title shown in the sources rail. */
  title: string;
  /** Optional external URL. Rendered as a real link when present. */
  url?: string;
  /** Optional one-line context shown under the title. */
  snippet?: string;
}

/** Ordered content the parent streams in. Text may contain blank-line paragraph breaks. */
export type ResponseSegment =
  | { type: "text"; text: string }
  | { type: "code"; code: string; lang?: string; filename?: string }
  | { type: "citation"; sourceId: string };

export interface AiResponseStreamProps {
  /** Ordered response segments supplied by the application. */
  segments: ResponseSegment[];
  /** Lifecycle state, owned by the application. */
  state: StreamState;
  /** Sources referenced by inline citations; rendered as a numbered rail. */
  sources?: StreamSource[];
  /** Label shown in the header (e.g. the assistant/model display name). */
  assistantName?: string;
  /** Message shown in the error banner when `state === "error"`. */
  errorMessage?: string;
  /** Show a blinking caret at the end of the stream. Ignored under reduced motion. */
  caret?: boolean;
  /** Called when the user presses Stop (only shown while streaming). */
  onStop?: () => void;
  /** Called when the user presses Retry (shown on error / stopped). */
  onRetry?: () => void;
  /** Called after a successful "Copy response", with the plain-text response. */
  onCopy?: (text: string) => void;
  className?: string;
}

/* helpers -------------------------------------------------------------- */

/** Serialise the response to plain text for the copy action (fenced code, `[n]` markers). */
function segmentsToText(segments: ResponseSegment[]): string {
  const out: string[] = [];
  for (const seg of segments) {
    if (seg.type === "text") out.push(seg.text);
    else if (seg.type === "code") out.push(`\n\`\`\`${seg.lang ?? ""}\n${seg.code}\n\`\`\`\n`);
    else out.push(`[${seg.sourceId}]`);
  }
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

type InlineNode =
  | { kind: "text"; text: string }
  | { kind: "citation"; sourceId: string; index: number };

type Block =
  | { kind: "para"; nodes: InlineNode[] }
  | { kind: "code"; code: string; lang?: string; filename?: string };

/** Group the flat segment list into paragraph + code blocks; number citations by first appearance. */
function toBlocks(segments: ResponseSegment[]): { blocks: Block[]; order: Record<string, number> } {
  const blocks: Block[] = [];
  const order: Record<string, number> = {};
  let current: InlineNode[] = [];
  const flush = () => {
    if (current.length) blocks.push({ kind: "para", nodes: current });
    current = [];
  };
  for (const seg of segments) {
    if (seg.type === "code") {
      flush();
      blocks.push({ kind: "code", code: seg.code, lang: seg.lang, filename: seg.filename });
    } else if (seg.type === "citation") {
      if (!(seg.sourceId in order)) order[seg.sourceId] = Object.keys(order).length + 1;
      current.push({ kind: "citation", sourceId: seg.sourceId, index: order[seg.sourceId] });
    } else {
      const parts = seg.text.split(/\n{2,}/);
      parts.forEach((part, i) => {
        if (i > 0) flush();
        if (part) current.push({ kind: "text", text: part });
      });
    }
  }
  flush();
  return { blocks, order };
}

const railId = (source: string, id: string) => `ai-src-${source}-${id}`;

/* status ---------------------------------------------------------------- */

const STATUS: Record<
  StreamState,
  { label: string; live: (name: string) => string; tone: string; icon: React.ReactNode }
> = {
  streaming: {
    label: "Responding",
    live: (n) => `${n} is responding.`,
    tone: "var(--color-accent)",
    icon: (
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
    ),
  },
  complete: {
    label: "Complete",
    live: () => "Response complete.",
    tone: "var(--color-success)",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  stopped: {
    label: "Stopped",
    live: () => "Response stopped.",
    tone: "var(--color-muted)",
    icon: <span className="block h-2.5 w-2.5 rounded-[2px] bg-current" aria-hidden />,
  },
  error: {
    label: "Failed",
    live: () => "Response failed.",
    tone: "var(--color-error)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 8v5M12 16.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
};

/* controls -------------------------------------------------------------- */

const btnBase =
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50";

function CopyButton({
  getText,
  onCopy,
  label = "Copy",
  copiedLabel = "Copied",
  className,
}: {
  getText: () => string;
  onCopy?: (text: string) => void;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const text = getText();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      onCopy?.(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (e.g. insecure context) — no-op, control stays usable */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        btnBase,
        "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]",
        className,
      )}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}

/* code block ------------------------------------------------------------ */

function CodeBlock({
  code,
  lang,
  filename,
  onCopy,
}: {
  code: string;
  lang?: string;
  filename?: string;
  onCopy?: (text: string) => void;
}) {
  const heading = filename ?? lang;
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-code-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-1.5">
        <span className="font-mono text-[11.5px] text-[var(--color-muted)]">{heading ?? "code"}</span>
        <CopyButton
          getText={() => code}
          onCopy={onCopy}
          label="Copy"
          copiedLabel="Copied"
          className="ml-auto border-transparent bg-transparent px-2 py-1 text-[11.5px] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        />
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 text-[12.5px] leading-relaxed">
        <code className="font-mono text-[var(--color-code-fg)]">{code}</code>
      </pre>
    </div>
  );
}

/* inline word reveal ---------------------------------------------------- */

function Word({ children, reduce }: { children: string; reduce: boolean }) {
  if (reduce) return <>{children}</>;
  return (
    <motion.span
      className="inline-block whitespace-pre [will-change:transform,opacity]"
      initial={{ opacity: 0, y: "0.25em" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.span>
  );
}

function InlineText({ text, reduce }: { text: string; reduce: boolean }) {
  // Split on whitespace, keeping the separators so spacing is preserved.
  const tokens = React.useMemo(() => text.split(/(\s+)/), [text]);
  return (
    <>
      {tokens.map((tok, i) =>
        tok === "" ? null : /^\s+$/.test(tok) ? (
          <React.Fragment key={i}>{tok}</React.Fragment>
        ) : (
          <Word key={i} reduce={reduce}>
            {tok}
          </Word>
        ),
      )}
    </>
  );
}

/* component ------------------------------------------------------------- */

export function AiResponseStream({
  segments,
  state,
  sources,
  assistantName = "Assistant",
  errorMessage = "The response was interrupted before it finished.",
  caret = true,
  onStop,
  onRetry,
  onCopy,
  className,
}: AiResponseStreamProps) {
  const reduce = useReducedMotion();
  const { blocks, order } = React.useMemo(() => toBlocks(segments), [segments]);
  const sourceById = React.useMemo(
    () => new Map((sources ?? []).map((s) => [s.id, s])),
    [sources],
  );
  const status = STATUS[state];
  const isStreaming = state === "streaming";
  const showCaret = caret && isStreaming && !reduce;

  // Only sources that were actually cited, in first-cited order.
  const citedSources = React.useMemo(
    () =>
      Object.entries(order)
        .sort((a, b) => a[1] - b[1])
        .map(([id, index]) => ({ index, source: sourceById.get(id), id }))
        .filter((c): c is { index: number; source: StreamSource; id: string } => Boolean(c.source)),
    [order, sourceById],
  );

  const renderCitation = (node: Extract<InlineNode, { kind: "citation" }>, key: React.Key) => {
    const source = sourceById.get(node.sourceId);
    const name = source ? `Source ${node.index}: ${source.title}` : `Source ${node.index}`;
    return (
      <a
        key={key}
        href={`#${railId("cmp", node.sourceId)}`}
        aria-label={name}
        title={source?.title}
        className="mx-0.5 inline-flex h-[1.15em] min-w-[1.15em] translate-y-[-0.15em] items-center justify-center rounded-[4px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1 align-baseline text-[0.72em] font-semibold leading-none text-[var(--color-accent)] no-underline transition-colors hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
      >
        {node.index}
      </a>
    );
  };

  return (
    <section
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
      aria-label={`${assistantName} response`}
    >
      {/* header ---------------------------------------------------------- */}
      <header className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-4 py-2.5">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_55%,#000))] text-[var(--color-accent-fg)]"
          aria-hidden
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          </svg>
        </span>
        <span className="text-[13px] font-semibold text-[var(--color-fg)]">{assistantName}</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
          style={{ color: status.tone, borderColor: "color-mix(in oklab, currentColor 45%, transparent)" }}
        >
          {status.icon}
          {status.label}
        </span>
      </header>

      {/* polite live region: lifecycle only, never token-by-token -------- */}
      <div role="status" aria-live="polite" className="sr-only">
        {status.live(assistantName)}
      </div>

      {/* body ------------------------------------------------------------ */}
      <div className="px-4 py-3.5 text-[14.5px] leading-[1.7] text-[var(--color-fg)]">
        {blocks.map((block, bi) => {
          if (block.kind === "code") {
            return <CodeBlock key={bi} code={block.code} lang={block.lang} filename={block.filename} onCopy={onCopy} />;
          }
          const isLastBlock = bi === blocks.length - 1;
          return (
            <p key={bi} className="mb-3 last:mb-0">
              {block.nodes.map((node, ni) =>
                node.kind === "citation" ? (
                  renderCitation(node, `c-${bi}-${ni}`)
                ) : (
                  <InlineText key={`t-${bi}-${ni}`} text={node.text} reduce={reduce} />
                ),
              )}
              {showCaret && isLastBlock ? (
                <motion.span
                  aria-hidden
                  className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] rounded-full bg-[var(--color-accent)] align-baseline"
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
            </p>
          );
        })}

        {blocks.length === 0 && isStreaming ? (
          <p className="flex items-center gap-1.5 text-[var(--color-muted)]" aria-hidden>
            {reduce ? (
              "Waiting for response…"
            ) : (
              [0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-current"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))
            )}
          </p>
        ) : null}

        {/* error banner: icon + text, not colour alone ------------------- */}
        <AnimatePresence initial={false}>
          {state === "error" ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--color-error)] bg-[color-mix(in_oklab,var(--color-error)_10%,transparent)] px-3 py-2 text-[13px] text-[var(--color-fg)]"
            >
              <span className="mt-[1px] shrink-0 text-[var(--color-error)]" aria-hidden>
                {STATUS.error.icon}
              </span>
              <span>{errorMessage}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* sources rail ---------------------------------------------------- */}
      {citedSources.length ? (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Sources</p>
          <ol className="flex flex-col gap-1.5">
            {citedSources.map(({ index, source, id }) => (
              <li
                key={id}
                id={railId("cmp", id)}
                className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[13px] target:bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)]"
              >
                <span className="mt-[1px] grid h-[18px] min-w-[18px] place-items-center rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface)] px-1 text-[11px] font-semibold text-[var(--color-accent)]">
                  {index}
                </span>
                <span className="min-w-0">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-[var(--color-fg)] underline decoration-[var(--color-border)] underline-offset-2 hover:decoration-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                    >
                      {source.title}
                    </a>
                  ) : (
                    <span className="font-medium text-[var(--color-fg)]">{source.title}</span>
                  )}
                  {source.snippet ? (
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--color-muted)]">{source.snippet}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* footer controls ------------------------------------------------- */}
      <footer className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] px-4 py-2.5">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className={cn(
              btnBase,
              "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-error)] hover:text-[var(--color-error)]",
            )}
          >
            <span className="block h-2.5 w-2.5 rounded-[2px] bg-current" aria-hidden />
            Stop
          </button>
        ) : null}

        {state === "error" || state === "stopped" ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(btnBase, "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M20 11a8 8 0 1 0-.7 4.2M20 5v4h-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retry
          </button>
        ) : null}

        <CopyButton
          getText={() => segmentsToText(segments)}
          onCopy={onCopy}
          label="Copy response"
          copiedLabel="Copied response"
          className="ml-auto"
        />
      </footer>
    </section>
  );
}

export default AiResponseStream;
