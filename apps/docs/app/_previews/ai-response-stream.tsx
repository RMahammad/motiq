"use client";

import * as React from "react";

import { AiResponseStream, type ResponseSegment, type StreamState, type StreamSource } from "@/registry/ai/ai-response-stream";
import { useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview fakes a stream from local, clearly-fictional data —
 * there is no model here. The real component only renders whatever segments +
 * state the application passes it.
 * ---------------------------------------------------------------------- */

const SOURCES: StreamSource[] = [
  { id: "1", title: "Vaultwind Engineering Handbook — Caching", url: "https://example.com/handbook/caching", snippet: "Internal guide · updated last quarter" },
  { id: "2", title: "RFC 9111: HTTP Caching", url: "https://example.com/rfc/9111", snippet: "Stale-while-revalidate semantics" },
];

// The full (fictional) response, authored as ordered pieces.
const PIECES: ResponseSegment[] = [
  {
    type: "text",
    text: "Yes — you can serve stale data instantly while refreshing it in the background. The pattern is called stale-while-revalidate, and it keeps the UI responsive without ever blocking on the network",
  },
  { type: "citation", sourceId: "1" },
  { type: "text", text: ".\n\nHere's a minimal wrapper you can drop into a data layer:" },
  {
    type: "code",
    lang: "ts",
    filename: "swr-cache.ts",
    code: `export async function withSWR<T>(\n  key: string,\n  fetcher: () => Promise<T>,\n  ttlMs = 30_000,\n) {\n  const hit = cache.get(key);\n  if (hit) {\n    if (Date.now() - hit.at > ttlMs) revalidate(key, fetcher);\n    return hit.value as T; // serve stale immediately\n  }\n  const value = await fetcher();\n  cache.set(key, { value, at: Date.now() });\n  return value;\n}`,
  },
  {
    type: "text",
    text: "The first caller waits once; everyone after gets an instant response and a quiet background refresh. Tune the TTL to how fresh the data must feel",
  },
  { type: "citation", sourceId: "2" },
  { type: "text", text: "." },
];

/** Flatten into stream "atoms": text → words (spaces kept), code/citation → one atom each. */
type Atom = { type: "word"; text: string } | { type: "citation"; sourceId: string } | { type: "code"; code: string; lang?: string; filename?: string };

const ATOMS: Atom[] = PIECES.flatMap((p) => {
  if (p.type === "text") {
    return p.text.split(/(\s+)/).filter(Boolean).map((text) => ({ type: "word", text }) as Atom);
  }
  if (p.type === "citation") return [{ type: "citation", sourceId: p.sourceId }];
  return [{ type: "code", code: p.code, lang: p.lang, filename: p.filename }];
});

const ERROR_AT = 24; // stop partway through when simulating an error

/** Reconstruct partial segments from the first `n` atoms (consecutive words re-join into one text segment). */
function partial(n: number): ResponseSegment[] {
  const out: ResponseSegment[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ type: "text", text: buf });
    buf = "";
  };
  for (const atom of ATOMS.slice(0, n)) {
    if (atom.type === "word") buf += atom.text;
    else {
      flush();
      if (atom.type === "citation") out.push({ type: "citation", sourceId: atom.sourceId });
      else out.push({ type: "code", code: atom.code, lang: atom.lang, filename: atom.filename });
    }
  }
  flush();
  return out;
}

const ctrl =
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors outline-none hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-50";

export function AiResponseStreamPreview() {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const visible = useVisibilityPause(wrapRef);

  const [count, setCount] = React.useState(ATOMS.length);
  const [state, setState] = React.useState<StreamState>("complete");
  const [errorMode, setErrorMode] = React.useState(false);

  const timer = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const errorModeRef = React.useRef(errorMode);
  errorModeRef.current = errorMode;
  const visibleRef = React.useRef(visible);
  visibleRef.current = visible;

  const stop = React.useCallback(() => {
    clearInterval(timer.current);
    timer.current = undefined;
  }, []);

  const start = React.useCallback(() => {
    stop();
    setCount(0);
    setState("streaming");
    timer.current = setInterval(() => {
      if (!visibleRef.current) return; // pause offscreen / backgrounded
      setCount((c) => {
        const next = c + 1;
        if (errorModeRef.current && next >= ERROR_AT) {
          stop();
          setState("error");
          return next;
        }
        if (next >= ATOMS.length) {
          stop();
          setState("complete");
          return ATOMS.length;
        }
        return next;
      });
    }, 95);
  }, [stop]);

  // Auto-start the demo stream on mount. The interval self-pauses while the
  // surface is offscreen/backgrounded (visibleRef), so we don't gate the start
  // on visibility — and starting here (with a matching cleanup) is robust to
  // React StrictMode's mount → cleanup → mount cycle. The previous startedRef
  // guard could leave the stream permanently stopped when the cleanup ran
  // between the two StrictMode invocations ("sometimes it doesn't start").
  React.useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const onStop = React.useCallback(() => {
    stop();
    setState("stopped");
  }, [stop]);

  const segments = React.useMemo(() => partial(count), [count]);

  return (
    <div ref={wrapRef} className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      {/* Controls rendered at the BOTTOM (order-last) for a consistent showcase layout. */}
      <div className="order-last flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={ctrl} onClick={start}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 11a8 8 0 1 0-.7 4.2M20 5v4h-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {state === "streaming" ? "Restart" : "Start stream"}
        </button>
        <button type="button" className={ctrl} onClick={onStop} disabled={state !== "streaming"}>
          <span className="block h-2.5 w-2.5 rounded-[2px] bg-current" aria-hidden />
          Stop
        </button>
        <label className="ml-auto flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={errorMode}
            onChange={(e) => setErrorMode(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Simulate an error
        </label>
      </div>

      <AiResponseStream
        segments={segments}
        state={state}
        sources={SOURCES}
        assistantName="Atlas"
        errorMessage="The connection dropped before the answer finished. Retry to stream it again."
        onStop={onStop}
        onRetry={start}
      />

      <p className="text-center text-[11.5px] text-[var(--color-muted)]">
        Demo stream from local sample data — no live model is involved.
      </p>
    </div>
  );
}

export default AiResponseStreamPreview;
