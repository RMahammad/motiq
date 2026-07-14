"use client";

import * as React from "react";

import {
  PromptComposer,
  type PromptModel,
  type PromptVariable,
  type PromptTemplate,
  type PromptAttachment,
  type ComposerStatus,
} from "@/registry/ai/prompt-composer";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a fictional "reply drafting" composer for the imaginary product
 * Acme Helpdesk. Every model name, variable, template, attachment and token
 * number below is invented and local. There is NO model and NO backend: the
 * component never calls anything, and the "Send" / "Stop" / "Retry" buttons
 * only flip this shell's own local state via setTimeout. Nothing is generated,
 * nothing is sent, no keys exist. The token estimate is a trivial local word
 * count — not a real tokenizer.
 * ---------------------------------------------------------------------- */

// Fictional, app-supplied model names (the component hardcodes none).
const MODELS: PromptModel[] = [
  { id: "swift", name: "Nimbus Swift", caption: "Fast · demo model" },
  { id: "atlas", name: "Nimbus Atlas", caption: "Balanced · demo model" },
  { id: "sage", name: "Nimbus Sage", caption: "Deep reasoning · demo model" },
  { id: "legacy", name: "Nimbus v1", caption: "Deprecated", disabled: true, disabledReason: "Retired — no longer available." },
];

const VARIABLES: PromptVariable[] = [
  { key: "customer_name", label: "Customer name", description: "Recipient's display name", sample: "Dana Okoro" },
  { key: "order_id", label: "Order id", description: "The ticket's order reference", sample: "AC-40192" },
  { key: "product", label: "Product", description: "Product the ticket is about", sample: "Ledger Pro" },
  { key: "tone", label: "Tone", description: "Desired writing tone", sample: "warm, concise" },
];

const TEMPLATES: PromptTemplate[] = [
  {
    id: "apology",
    label: "Apology + fix",
    description: "Acknowledge, apologise, offer a concrete next step",
    body: "Write a {{tone}} reply to {{customer_name}} about order {{order_id}}. Apologise for the delay with {{product}} and offer a concrete next step.",
  },
  {
    id: "howto",
    label: "How-to explainer",
    description: "Step-by-step walkthrough",
    body: "Explain to {{customer_name}} how to set up {{product}}, as a numbered list, in a {{tone}} tone.",
  },
  {
    id: "followup",
    label: "Follow-up nudge",
    description: "Gentle check-in",
    body: "Draft a short follow-up to {{customer_name}} checking whether order {{order_id}} is resolved.",
  },
];

const ATTACHMENTS: PromptAttachment[] = [
  { id: "screenshot", name: "error-screenshot.png", kind: "image", meta: "412 KB", status: "ready" },
  { id: "ticket", name: "ticket-AC-40192.json", kind: "data", meta: "3 KB", status: "ready" },
  { id: "log", name: "session.log", kind: "code", meta: "uploading…", status: "uploading" },
];

// Trivial local "token" estimate — a word count, NOT a real tokenizer.
function estimateTokens(text: string): number {
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  return Math.round(words * 1.4);
}

export function PromptComposerPreview() {
  const [text, setText] = React.useState(
    "Draft a reply to {{customer_name}} about their issue with {{product}}.",
  );
  const [modelId, setModelId] = React.useState("atlas");
  const [status, setStatus] = React.useState<ComposerStatus>("idle");
  const [attachments, setAttachments] = React.useState<PromptAttachment[]>(ATTACHMENTS);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const clear = () => { if (timer.current) clearTimeout(timer.current); };

  // Fictional local flow: pretend the app is working, then settle. No model runs.
  const runSubmit = React.useCallback(() => {
    clear();
    setStatus("loading");
    timer.current = setTimeout(() => {
      setStatus("streaming");
      timer.current = setTimeout(() => setStatus("idle"), 1400);
    }, 700);
  }, []);

  const runFailure = React.useCallback(() => {
    clear();
    setStatus("loading");
    timer.current = setTimeout(() => setStatus("error"), 800);
  }, []);

  const reset = React.useCallback(() => {
    clear();
    setStatus("idle");
    setText("Draft a reply to {{customer_name}} about their issue with {{product}}.");
    setAttachments(ATTACHMENTS);
    setModelId("atlas");
  }, []);

  const tokenCount = estimateTokens(text);

  const controlBtn =
    "inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="w-full max-w-[760px]">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--color-muted)]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-fg)]">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white" aria-hidden>A</span>
          Acme Helpdesk · Reply drafter
        </span>
        <span>Demo data · no model, nothing is sent</span>
      </div>

      <PromptComposer
        value={text}
        onValueChange={setText}
        label="Reply prompt"
        placeholder="Describe the reply you want…"
        variables={VARIABLES}
        onInsertVariable={(v) => console.debug("insert variable", v.key)}
        templates={TEMPLATES}
        onInsertTemplate={(t) => console.debug("insert template", t.id)}
        attachments={attachments}
        onRemoveAttachment={(a) => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
        onAddAttachment={() =>
          setAttachments((prev) => [
            ...prev,
            { id: `demo-${prev.length}`, name: "note.txt", kind: "file", meta: "1 KB", status: "ready" },
          ])
        }
        models={MODELS}
        selectedModelId={modelId}
        onModelChange={(id) => setModelId(id)}
        tokenCount={tokenCount}
        maxTokens={200}
        status={status}
        onSubmit={runSubmit}
        onStop={() => setStatus("idle")}
        onRetry={runSubmit}
      />

      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Demo controls">
        <button type="button" className={controlBtn} onClick={runSubmit}>Simulate send</button>
        <button type="button" className={controlBtn} onClick={runFailure}>Simulate failure</button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button
          type="button"
          className={controlBtn}
          onClick={() => setText((t) => t + " ".repeat(1) + "Add a lot more detail so the draft runs long. ".repeat(20))}
        >
          Fill past token limit
        </button>
        <button type="button" className={controlBtn} onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

export default PromptComposerPreview;
