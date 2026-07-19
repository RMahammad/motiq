"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useControllableState,
  useReducedMotion,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * PromptComposer — a production-oriented prompt-composition surface for an AI
 * feature. It is a PRESENTATION + CONTROL surface only: it never calls a model,
 * never sends the prompt anywhere, and holds no keys. The host application owns
 * everything real — the model list, the attachments, the token estimate, the
 * available variables/templates, and the actual submit/stop/retry work. This
 * component renders those inputs coherently and calls back so the app can act.
 *
 * What it gives you over a bare <textarea>: an auto-sizing multiline input with
 * a caret-aware {{variable}} inserter (highlighting which variables are already
 * in the draft), an app-supplied attachment tray with per-item remove, template
 * insertion, a model picker integration point, an honest app-owned token/char
 * budget (conveyed by icon + text, never colour alone), and idle / loading /
 * streaming / error states with Submit, Stop and Retry. Keyboard: Cmd/Ctrl+Enter
 * submits; Escape closes any open menu. Mobile: the action row is sticky to the
 * bottom of the card and avoids fixed-viewport assumptions. Every animation has
 * a reduced-motion path; the textarea is labelled and status is announced via a
 * polite live region. Clean-room original.
 * ----------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface PromptVariable {
  /** Token key used inside `{{ }}` — e.g. "customer_name". */
  key: string;
  /** Human label for the insert menu; defaults to `key`. */
  label?: string;
  /** Short description shown in the insert menu. */
  description?: string;
  /** Example value shown as a hint only — never inserted, never sent. */
  sample?: string;
}

export type AttachmentStatus = "ready" | "uploading" | "error" | (string & {});

export interface PromptAttachment {
  id: string;
  name: string;
  /** Drives the icon; unknown kinds fall back to a generic file glyph. */
  kind?: "image" | "file" | "code" | "audio" | "data" | (string & {});
  /** Small secondary text — e.g. a size or type label. */
  meta?: string;
  /** App-owned upload/processing state (shown by icon + text). */
  status?: AttachmentStatus;
}

export interface PromptTemplate {
  id: string;
  label: string;
  /** Text inserted at the caret when chosen. */
  body: string;
  description?: string;
}

export interface PromptModel {
  id: string;
  /** Display name — the APP supplies this; the component hardcodes none. */
  name: string;
  /** Optional caption, e.g. an app-provided context-window label. */
  caption?: string;
  disabled?: boolean;
  disabledReason?: string;
}

/** App-owned lifecycle of the surrounding request. */
export type ComposerStatus = "idle" | "loading" | "streaming" | "error";

export interface PromptComposerProps {
  /** Controlled prompt text. */
  value?: string;
  /** Uncontrolled initial prompt text. */
  defaultValue?: string;
  /** Fired on every edit (typing, variable/template insertion). */
  onValueChange?: (value: string) => void;

  /** Accessible label for the textarea. */
  label?: string;
  placeholder?: string;

  /** Variables the app offers; rendered as insertable, highlightable chips. */
  variables?: PromptVariable[];
  /** Fired when a variable is inserted (the app owns the authoritative list). */
  onInsertVariable?: (variable: PromptVariable) => void;

  /** Attachments the app has attached to this prompt. */
  attachments?: PromptAttachment[];
  /** Remove an attachment. When absent, attachments are read-only. */
  onRemoveAttachment?: (attachment: PromptAttachment) => void;
  /** When provided, an "Add" affordance opens the app's own picker. */
  onAddAttachment?: () => void;

  /** Reusable prompt snippets the app supplies. */
  templates?: PromptTemplate[];
  /** Fired when a template is inserted. */
  onInsertTemplate?: (template: PromptTemplate) => void;

  /** Models the app offers. Names come from the app — never hardcoded here. */
  models?: PromptModel[];
  /** Controlled selected model id. */
  selectedModelId?: string;
  /** Fired when the user picks a model. */
  onModelChange?: (id: string, model: PromptModel) => void;

  /** App-computed token/character estimate for the current prompt. */
  tokenCount?: number;
  /** Optional budget; when set, "remaining" and over-limit state are shown. */
  maxTokens?: number;
  /** Unit word for the estimate. Default "tokens". */
  tokenNoun?: string;

  /** App-owned request lifecycle. */
  status?: ComposerStatus;
  /** Submit the prompt. The app performs the real work. */
  onSubmit?: (value: string) => void;
  /** Stop an in-flight request (shown while loading/streaming). */
  onStop?: () => void;
  /** Retry after an error (shown when `status === "error"`). */
  onRetry?: () => void;

  /** Fully disable the surface. */
  disabled?: boolean;
  submitLabel?: string;
  /** Minimum visible rows. Default 3. */
  minRows?: number;
  /** Maximum rows before the textarea scrolls. Default 12. */
  maxRows?: number;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Constants + helpers                                                         */
/* -------------------------------------------------------------------------- */

const EASE: Transition["ease"] = [0.2, 0, 0, 1];
const LINE_PX = 22; // approximate line height for row → max-height mapping

function variablePattern(key: string): RegExp {
  // Matches {{ key }} allowing surrounding whitespace. `key` is a plain token.
  return new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------------------------------------------------- */
/* Status glyphs (icon + text — never colour alone)                            */
/* -------------------------------------------------------------------------- */

function ToneIcon({ tone, spin }: { tone: StatusTone; spin?: boolean }) {
  const common = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const stroke = { stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (spin)
    return (
      <motion.svg {...common} animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}>
        <path d="M12 3a9 9 0 1 0 9 9" {...stroke} />
      </motion.svg>
    );
  if (tone === "success")
    return (
      <svg {...common}>
        <path d="M4 12.5 9 17.5 20 6.5" {...stroke} />
      </svg>
    );
  if (tone === "warning")
    return (
      <svg {...common}>
        <path d="M12 8v5M12 16.5v.5M12 3 2 20h20L12 3Z" {...stroke} />
      </svg>
    );
  if (tone === "error")
    return (
      <svg {...common}>
        <path d="M12 8v5M12 16.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" {...stroke} />
      </svg>
    );
  // info / neutral / active
  return (
    <svg {...common}>
      <path d="M12 11v6M12 7.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" {...stroke} />
    </svg>
  );
}

function AttachmentGlyph({ kind }: { kind?: PromptAttachment["kind"] }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "image")
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" {...stroke} />
        <circle cx="8.5" cy="9.5" r="1.6" {...stroke} />
        <path d="m4 17 5-5 4 4 2-2 5 5" {...stroke} />
      </svg>
    );
  if (kind === "code")
    return (
      <svg {...common}>
        <path d="m9 8-4 4 4 4M15 8l4 4-4 4" {...stroke} />
      </svg>
    );
  if (kind === "audio")
    return (
      <svg {...common}>
        <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10v4" {...stroke} />
      </svg>
    );
  if (kind === "data")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="6" rx="7" ry="3" {...stroke} />
        <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" {...stroke} />
        <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" {...stroke} />
      </svg>
    );
  // file (default)
  return (
    <svg {...common}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" {...stroke} />
      <path d="M14 3v5h5" {...stroke} />
    </svg>
  );
}

const ATTACHMENT_STATUS: Record<string, { tone: StatusTone; label: string; spin?: boolean }> = {
  ready: { tone: "success", label: "Ready" },
  uploading: { tone: "info", label: "Uploading", spin: true },
  error: { tone: "error", label: "Failed" },
};

/* -------------------------------------------------------------------------- */
/* Small popover menu (button + region), reduced-motion aware                  */
/* -------------------------------------------------------------------------- */

interface MenuProps {
  label: string;
  disabled?: boolean;
  reduce: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}

function Menu({ label, disabled, reduce, open, onOpenChange, trigger, children }: MenuProps) {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const reactId = React.useId();
  const panelId = `mk-menu-${reactId}`;
  // Portal position, anchored above the trigger. Measured on open + on scroll/
  // resize so the panel escapes the composer's `overflow-hidden` clip and never
  // gets cut off at the component's edge.
  const [rect, setRect] = React.useState<{ left: number; top: number; width: number } | null>(null);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const place = React.useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    setRect({ left: r.left, top: r.top, width: r.width });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    const onReflow = () => place();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, close, place]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {trigger}
      </button>
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && rect ? (
                <motion.div
                  ref={panelRef}
                  id={panelId}
                  role="menu"
                  aria-label={label}
                  initial={reduce ? false : { opacity: 0, y: 6, scale: 0.98 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  style={{
                    position: "fixed",
                    left: rect.left,
                    // anchor the panel's BOTTOM 8px above the trigger's top edge
                    bottom: `calc(100vh - ${rect.top}px + 8px)`,
                    transformOrigin: "bottom left",
                  }}
                  className="z-[60] max-h-[280px] w-[min(320px,80vw)] overflow-auto rounded-xl bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
                >
                  {children(() => {
                    close();
                    triggerRef.current?.focus();
                  })}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function PromptComposer({
  value,
  defaultValue = "",
  onValueChange,
  label = "Prompt",
  placeholder = "Write a prompt…",
  variables = [],
  onInsertVariable,
  attachments = [],
  onRemoveAttachment,
  onAddAttachment,
  templates = [],
  onInsertTemplate,
  models = [],
  selectedModelId,
  onModelChange,
  tokenCount,
  maxTokens,
  tokenNoun = "tokens",
  status = "idle",
  onSubmit,
  onStop,
  onRetry,
  disabled = false,
  submitLabel = "Send",
  minRows = 3,
  maxRows = 12,
  className,
}: PromptComposerProps) {
  const reduce = useReducedMotion();
  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [liveMessage, setLiveMessage] = React.useState("");
  const [varsOpen, setVarsOpen] = React.useState(false);
  const [templatesOpen, setTemplatesOpen] = React.useState(false);
  const [modelOpen, setModelOpen] = React.useState(false);

  const announce = React.useCallback((msg: string) => setLiveMessage(msg), []);

  const isBusy = status === "loading" || status === "streaming";

  /* -- token budget (app-owned, icon + text) --------------------------- */

  const budget = React.useMemo(() => {
    if (tokenCount == null) return null;
    const hasMax = maxTokens != null && maxTokens > 0;
    const remaining = hasMax ? maxTokens! - tokenCount : null;
    const over = hasMax && tokenCount > maxTokens!;
    const near = hasMax && !over && tokenCount >= maxTokens! * 0.9;
    const tone: StatusTone = over ? "error" : near ? "warning" : "neutral";
    const text = over
      ? `Over ${tokenNoun} limit by ${tokenCount - maxTokens!}`
      : hasMax
        ? `${remaining} ${tokenNoun} left`
        : `${tokenCount} ${tokenNoun}`;
    return { tone, text, over, remaining, hasMax };
  }, [tokenCount, maxTokens, tokenNoun]);

  const overLimit = budget?.over ?? false;

  /* -- caret-aware insertion ------------------------------------------- */

  const insertAtCaret = React.useCallback(
    (snippet: string) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? text.length;
      const next = text.slice(0, start) + snippet + text.slice(end);
      setText(next);
      const caret = start + snippet.length;
      requestAnimationFrame(() => {
        el?.focus();
        try {
          el?.setSelectionRange(caret, caret);
        } catch {
          /* selection unsupported — non-fatal */
        }
      });
    },
    [text, setText],
  );

  const insertVariable = React.useCallback(
    (variable: PromptVariable) => {
      insertAtCaret(`{{${variable.key}}}`);
      onInsertVariable?.(variable);
      announce(`Inserted variable ${variable.label ?? variable.key}`);
    },
    [insertAtCaret, onInsertVariable, announce],
  );

  const insertTemplate = React.useCallback(
    (template: PromptTemplate) => {
      // A template is a whole prompt, so applying one REPLACES the draft rather
      // than inserting at the caret — picking another template swaps it out
      // instead of appending onto the previous one.
      setText(template.body);
      const el = textareaRef.current;
      const caret = template.body.length;
      requestAnimationFrame(() => {
        el?.focus();
        try {
          el?.setSelectionRange(caret, caret);
        } catch {
          /* selection unsupported — non-fatal */
        }
      });
      onInsertTemplate?.(template);
      announce(`Applied template ${template.label}`);
    },
    [setText, onInsertTemplate, announce],
  );

  /* -- submit ----------------------------------------------------------- */

  const canSubmit = !disabled && !isBusy && !overLimit && text.trim().length > 0;

  const submit = React.useCallback(() => {
    if (!canSubmit) return;
    onSubmit?.(text);
  }, [canSubmit, onSubmit, text]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  /* -- selected model --------------------------------------------------- */

  const selectedModel = React.useMemo(
    () => models.find((m) => m.id === selectedModelId) ?? models[0],
    [models, selectedModelId],
  );

  /* -- present variables ------------------------------------------------ */

  const usedVariableKeys = React.useMemo(() => {
    const used = new Set<string>();
    for (const v of variables) if (variablePattern(v.key).test(text)) used.add(v.key);
    return used;
  }, [variables, text]);

  const maxHeight = Math.max(minRows, maxRows) * LINE_PX + 20;

  return (
    <section
      aria-label={`${label} composer`}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        disabled && "opacity-70",
        className,
      )}
    >
      {/* variable chips (highlight which are already in the draft) --------- */}
      {variables.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Variables</span>
          {variables.map((v) => {
            const inUse = usedVariableKeys.has(v.key);
            return (
              <button
                key={v.key}
                type="button"
                disabled={disabled}
                onClick={() => insertVariable(v)}
                aria-pressed={inUse}
                title={v.description ?? (v.sample ? `e.g. ${v.sample}` : undefined)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50",
                  inUse
                    ? "[border:1px_solid_var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-fg)]"
                    : "[border:1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]",
                )}
              >
                {inUse ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 12.5 9 17.5 20 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span aria-hidden className="text-[var(--color-muted)]">+</span>
                )}
                <span aria-hidden>{`{{${v.key}}}`}</span>
                <span className="sr-only">
                  {v.label ?? v.key} - {inUse ? "in use, insert again" : "insert into prompt"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* textarea ---------------------------------------------------------- */}
      <div className="px-3 pt-3">
        <textarea
          ref={textareaRef}
          aria-label={label}
          value={text}
          placeholder={placeholder}
          rows={minRows}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ maxHeight }}
          className="w-full resize-y bg-transparent text-[14px] leading-relaxed text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] disabled:cursor-not-allowed"
        />
      </div>

      {/* attachments tray -------------------------------------------------- */}
      {attachments.length > 0 || onAddAttachment ? (
        <div className="px-3 pb-1 pt-1.5">
          <ul role="list" className="flex flex-wrap items-center gap-1.5">
            {attachments.map((att) => {
              const s = att.status ? ATTACHMENT_STATUS[att.status] : undefined;
              return (
                <li
                  key={att.id}
                  className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg bg-[var(--color-bg-secondary)] px-2 py-1 text-[12px] text-[var(--color-fg)] [border:1px_solid_var(--color-border)]"
                >
                  <span className="text-[var(--color-muted)]">
                    <AttachmentGlyph kind={att.kind} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{att.name}</span>
                  {att.meta ? <span className="shrink-0 text-[var(--color-muted)]">{att.meta}</span> : null}
                  {s ? (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 text-[11px]"
                      style={{ color: statusVars(s.tone).color }}
                    >
                      <ToneIcon tone={s.tone} spin={s.spin} />
                      <span>{s.label}</span>
                    </span>
                  ) : null}
                  {onRemoveAttachment ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemoveAttachment(att)}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="sr-only">Remove attachment {att.name}</span>
                    </button>
                  ) : null}
                </li>
              );
            })}
            {onAddAttachment ? (
              <li>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onAddAttachment}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--color-muted)] outline-none [border:1px_dashed_var(--color-border)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Attach
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {/* sticky action row ------------------------------------------------- */}
      <div className="sticky bottom-0 mt-1 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
        {/* left: insertion menus + model picker */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {variables.length > 0 ? (
            <Menu
              label="Insert a variable"
              disabled={disabled}
              reduce={reduce}
              open={varsOpen}
              onOpenChange={setVarsOpen}
              trigger={
                <>
                  <span aria-hidden className="font-mono">{"{ }"}</span>
                  <span className="hidden sm:inline">Variable</span>
                  <span className="sr-only">Insert a variable</span>
                </>
              }
            >
              {(close) =>
                variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      insertVariable(v);
                      close();
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <span className="font-mono text-[12.5px] text-[var(--color-fg)]">{`{{${v.key}}}`}</span>
                    {v.description ? <span className="text-[11.5px] text-[var(--color-muted)]">{v.description}</span> : null}
                    {v.sample ? <span className="text-[11px] text-[var(--color-muted)]">e.g. {v.sample}</span> : null}
                  </button>
                ))
              }
            </Menu>
          ) : null}

          {templates.length > 0 ? (
            <Menu
              label="Insert a template"
              disabled={disabled}
              reduce={reduce}
              open={templatesOpen}
              onOpenChange={setTemplatesOpen}
              trigger={
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span className="hidden sm:inline">Template</span>
                  <span className="sr-only">Insert a template</span>
                </>
              }
            >
              {(close) =>
                templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      insertTemplate(t);
                      close();
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <span className="text-[12.5px] font-medium text-[var(--color-fg)]">{t.label}</span>
                    {t.description ? <span className="text-[11.5px] text-[var(--color-muted)]">{t.description}</span> : null}
                  </button>
                ))
              }
            </Menu>
          ) : null}

          {models.length > 0 ? (
            <Menu
              label="Choose a model"
              disabled={disabled}
              reduce={reduce}
              open={modelOpen}
              onOpenChange={setModelOpen}
              trigger={
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6 7.7 7.7M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span className="max-w-[120px] truncate">{selectedModel?.name ?? "Model"}</span>
                  <span className="sr-only">Choose a model, currently {selectedModel?.name ?? "none selected"}</span>
                </>
              }
            >
              {(close) =>
                models.map((m) => {
                  const active = m.id === selectedModel?.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      disabled={m.disabled}
                      title={m.disabled ? m.disabledReason : undefined}
                      onClick={() => {
                        if (m.disabled) return;
                        onModelChange?.(m.id, m);
                        announce(`Model set to ${m.name}`);
                        close();
                      }}
                      className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center" aria-hidden>
                        {active ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12.5 9 17.5 20 6.5" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-medium text-[var(--color-fg)]">{m.name}</span>
                        {m.caption ? <span className="block text-[11.5px] text-[var(--color-muted)]">{m.caption}</span> : null}
                        {m.disabled && m.disabledReason ? (
                          <span className="block text-[11px] text-[var(--color-muted)]">{m.disabledReason}</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              }
            </Menu>
          ) : null}
        </div>

        {/* right: budget + actions */}
        <div className="ml-auto flex items-center gap-2.5">
          {budget ? (
            <span
              className="inline-flex items-center gap-1 text-[12px] font-medium tabular-nums"
              style={{ color: statusVars(budget.tone).color }}
            >
              <ToneIcon tone={budget.tone} />
              <span>{budget.text}</span>
            </span>
          ) : null}

          {status === "error" && onRetry ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onRetry}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: statusVars("error").color, border: `1px solid ${statusVars("error").border}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retry
            </button>
          ) : null}

          {isBusy && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] transition-colors hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              aria-keyshortcuts="Meta+Enter Control+Enter"
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-accent-foreground,white)] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status === "loading" ? (
                <>
                  <ToneIcon tone="info" spin />
                  Sending…
                </>
              ) : (
                <>
                  {submitLabel}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* helper line ------------------------------------------------------- */}
      <div className="flex items-center gap-1 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-[11px] text-[var(--color-muted)]">
        <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">⌘/Ctrl</kbd>
        <span aria-hidden>+</span>
        <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">↵</kbd>
        <span>to send · Esc closes menus · nothing is sent anywhere from this surface</span>
      </div>

      {/* polite live region for insertions + model + status --------------- */}
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
        {status === "loading" ? " Request sending." : ""}
        {status === "streaming" ? " Response streaming." : ""}
        {status === "error" ? " Request failed. Retry available." : ""}
        {overLimit ? " Prompt is over the token limit." : ""}
      </div>
    </section>
  );
}

export default PromptComposer;
