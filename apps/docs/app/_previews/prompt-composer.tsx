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
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
  AnimatedDialogBody,
} from "@/registry/animated-shadcn/animated-dialog";

// Fictional attachment sources for the "Attach from…" picker.
const ATTACH_SOURCES: { key: string; label: string; hint: string; icon: React.ReactNode; file: { name: string; kind: PromptAttachment["kind"]; meta: string } }[] = [
  { key: "computer", label: "Upload from computer", hint: "Choose a local file", icon: (<path d="M12 15V4m0 0 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />), file: { name: "notes.pdf", kind: "file", meta: "88 KB" } },
  { key: "drive", label: "Google Drive", hint: "Pick from your Drive", icon: (<path d="m8 3 8 14M4 17 12 3M20 17H4l4-7h8z" />), file: { name: "product-spec.gdoc", kind: "data", meta: "Google Drive" } },
  { key: "dropbox", label: "Dropbox", hint: "Pick from Dropbox", icon: (<path d="m12 6-5 3 5 3 5-3-5-3zM2 9l5 3-5 3 5 3 5-3M22 9l-5 3 5 3-5 3-5-3" />), file: { name: "handoff.zip", kind: "file", meta: "Dropbox · 2.1 MB" } },
  { key: "link", label: "Paste a link", hint: "Attach a URL", icon: (<path d="M9 15 15 9M10.5 7.5 12 6a4 4 0 0 1 6 6l-1.5 1.5M13.5 16.5 12 18a4 4 0 0 1-6-6l1.5-1.5" />), file: { name: "figma.com/file/aurora", kind: "code", meta: "Link" } },
];

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
  const [attachOpen, setAttachOpen] = React.useState(false);
  const attachIdRef = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add an attachment from a chosen source: appears as "uploading…", then settles
  // to "ready" — so the picker demonstrates a real per-source flow, not a canned file.
  const addFromSource = React.useCallback((key: string) => {
    const src = ATTACH_SOURCES.find((s) => s.key === key);
    if (!src) return;
    attachIdRef.current += 1;
    const id = `att-${attachIdRef.current}`;
    setAttachments((prev) => [...prev, { id, name: src.file.name, kind: src.file.kind, meta: "uploading…", status: "uploading" }]);
    setAttachOpen(false);
    window.setTimeout(() => {
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, meta: src.file.meta, status: "ready" } : a)));
    }, 1200);
  }, []);

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
    setAttachOpen(false);
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
        onAddAttachment={() => setAttachOpen(true)}
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

      <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5" role="group" aria-label="Demo controls">
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

      {/* Attach source picker — our library AnimatedDialog. Choosing a source adds
          an attachment that uploads then settles to ready (no real upload happens). */}
      <AnimatedDialog animation="scale" open={attachOpen} onOpenChange={setAttachOpen}>
        <AnimatedDialogContent className="sm:max-w-md">
          <AnimatedDialogHeader>
            <AnimatedDialogTitle>Attach from…</AnimatedDialogTitle>
            <AnimatedDialogDescription>Pick a source. Demo only — nothing is uploaded or sent.</AnimatedDialogDescription>
          </AnimatedDialogHeader>
          <AnimatedDialogBody className="grid gap-2 sm:grid-cols-2">
            {ATTACH_SOURCES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => addFromSource(s.key)}
                className="flex items-center gap-3 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-left outline-none transition-colors hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent-text)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {s.icon}
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-[var(--color-fg)]">{s.label}</span>
                  <span className="block text-[12px] text-[var(--color-muted)]">{s.hint}</span>
                </span>
              </button>
            ))}
          </AnimatedDialogBody>
        </AnimatedDialogContent>
      </AnimatedDialog>
    </div>
  );
}

export default PromptComposerPreview;
