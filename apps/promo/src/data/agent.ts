/** Fictional AI-agent scenario shared by the README hero and the AI pack spotlight. */

export const AGENT_PROMPT =
  "Why did checkout p95 spike after yesterday's deploy? Draft an incident summary.";

export const AGENT_RUN_TITLE = "Investigate checkout latency spike";

/** Response text is authored as word-safe chunks so streaming slices cleanly. */
export const RESPONSE_TEXT_A =
  "Checkout p95 rose from 412 ms to 638 ms immediately after deploy #8123 shipped at 14:31 UTC";
export const RESPONSE_TEXT_B =
  ". The regression traces to the new cart-validation call running serially on the hot path";
export const RESPONSE_TEXT_C =
  ". Rolling back — or memoizing the validator — returns latency to baseline.";

export const STREAM_SOURCES = [
  { id: "1", title: "Deploy log #8123", snippet: "checkout-api · 14:31 UTC" },
  { id: "2", title: "Trace: cart validation span", snippet: "+218 ms serial call" },
];

/** Richer source objects for the SourceCitationRail panel (spotlight only). */
export const RAIL_SOURCES = [
  {
    id: "1",
    index: 1,
    title: "Deploy log #8123",
    domain: "deploys.internal",
    type: "log",
    excerpt: "checkout-api rolled out at 14:31 UTC — config: cart validation enabled.",
    relevance: 0.94,
    verified: true,
  },
  {
    id: "2",
    index: 2,
    title: "Trace: cart validation span",
    domain: "tracing.internal",
    type: "trace",
    excerpt: "validate_cart p95 +218 ms, invoked serially before payment intent.",
    relevance: 0.88,
    verified: true,
  },
  {
    id: "3",
    index: 3,
    title: "Runbook: checkout rollback",
    domain: "runbooks.internal",
    type: "doc",
    excerpt: "Safe rollback path for checkout-api within a release window.",
    relevance: 0.71,
  },
];

export const TOOL_META = {
  metrics: {
    id: "tc-metrics",
    name: "Query p95 latency",
    category: "search",
    input: 'service="checkout" window="24h" percentile=95',
    output: "p95 412 ms → 638 ms after 14:32 UTC",
    durationMs: 420,
  },
  deploys: {
    id: "tc-deploys",
    name: "List recent deploys",
    category: "read",
    input: 'service="checkout-api" limit=5',
    output: "deploy #8123 · checkout-api · 14:31 UTC",
    durationMs: 780,
  },
  post: {
    id: "tc-post",
    name: "Post summary to #incidents",
    category: "write",
    input: 'channel="#incidents" severity="sev3"',
    output: "Posted incident summary (sev3).",
    durationMs: 240,
  },
} as const;
