"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useCopy, useDisclosure, scrollIntoViewWithin, streamItemVariants } from "@/lib/motionkit";

/**
 * SourceCitationRail — attributes an answer to its sources by keeping inline
 * `[n]` citation markers and a side rail of sources in sync. Selecting a marker
 * highlights (and scrolls to) its source in the rail; selecting a source in the
 * rail highlights (and scrolls to) its marker in the text.
 *
 * It is a *presentation* component. The application owns every source and the
 * text: it passes them in and decides what "active" means. This component never
 * generates a citation, never retrieves anything, never verifies a source, and
 * never invents a confidence or relevance number. It only renders the
 * `CitationSource[]` you give it and reports selection back through callbacks.
 * A `verified` flag, when present, is displayed as an *app-provided* state and
 * labelled as such — the component makes no claim of its own.
 *
 * Accessibility: markers are real <button>s with descriptive names and
 * `aria-pressed`; the rail is a <nav> whose source rows expose `aria-current`
 * and support Up/Down/Home/End roving selection; excerpts are real disclosures
 * (`aria-expanded`, mounted region); a source URL is a semantic <a> that opens
 * in a new tab with a clear "opens in a new tab" name and `rel="noopener
 * noreferrer"`. The active state is never colour-only (accent bar + weight +
 * an "Active" label + `aria-current`). Under `prefers-reduced-motion`
 * everything renders in its final state and scrolling is instant. Clean-room
 * original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type CitationLayout = "rail" | "list" | "cards";
export type CitationMobileBehavior = "stacked" | "bottom";

export interface CitationSource {
  /** Stable identifier, referenced by inline markers. */
  id: string;
  /** The number shown in the inline `[n]` marker and the rail badge. */
  index: number;
  /** Source title / headline. */
  title: string;
  /** Host or publication, e.g. "docs.example.com". */
  domain?: string;
  /** Canonical URL. When present the rail renders a semantic external link. */
  url?: string;
  /** Free-form kind used to pick a glyph + chip, e.g. "docs" | "article" | "paper" | "dataset" | "web". */
  type?: string;
  /** A short quoted passage — shown, verbatim, only when the app provides it. */
  excerpt?: string;
  /** Author / byline (app-provided). */
  author?: string;
  /** Publication date — Date, epoch ms, or ISO string. */
  publishedAt?: Date | number | string;
  /** When the app associated this source with the answer (app-provided, displayed as-is). */
  retrievedAt?: Date | number | string;
  /** App-provided relevance in `0..1`, displayed only. The component never computes it. */
  relevance?: number;
  /** A within-source locator, e.g. "§3.2" or "p. 14". */
  location?: string;
  /** App-provided verification state. Displayed and labelled as app-provided — never inferred. */
  verified?: boolean;
  /** Optional leading node (favicon / letter) rendered in place of the type glyph. */
  favicon?: React.ReactNode;
}

/** State passed to custom renderers. */
export interface CitationSourceState {
  active: boolean;
}

export interface SourceCitationRailProps {
  /** The sources, in rail display order. */
  sources: CitationSource[];
  /** The answer / article body — place `<CitationMarker source="…" />` inline within it. */
  children: React.ReactNode;
  /** Controlled active source id (`null` clears). Pair with `onActiveSourceChange`. */
  activeSourceId?: string | null;
  /** Uncontrolled initial active source id. */
  defaultActiveSourceId?: string | null;
  /** Notified when the active source changes (marker click, rail select, keyboard). */
  onActiveSourceChange?: (id: string | null) => void;
  /** Notified when a source's external link is opened. */
  onOpenSource?: (source: CitationSource) => void;
  /** Rail presentation: side `rail`, compact `list`, or expandable `cards`. */
  layout?: CitationLayout;
  /** Show the excerpt disclosure on each source (only ever shows an app-provided excerpt). */
  showExcerpts?: boolean;
  /** Rail heading. */
  title?: string;
  /** On small screens, `stacked` keeps the rail in flow; `bottom` pins it as a bottom panel. */
  mobileBehavior?: CitationMobileBehavior;
  /** Format a source date. Defaults to a locale short date. */
  formatDate?: (d: Date) => string;
  /** Fully replace a rail source row. */
  renderSource?: (source: CitationSource, state: CitationSourceState) => React.ReactNode;
  className?: string;
}

export interface CitationMarkerProps {
  /** The `CitationSource.id` this marker points at. */
  source: string;
  /** Override the marker's inner content (defaults to the source index). */
  children?: React.ReactNode;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

interface RailContextValue {
  activeId: string | null;
  setActive: (id: string | null, origin?: "marker" | "rail" | "external") => void;
  sourcesById: Map<string, CitationSource>;
  registerMarker: (id: string, el: HTMLElement | null) => void;
  reduce: boolean;
}

const RailContext = React.createContext<RailContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Helpers + icons                                                             */
/* -------------------------------------------------------------------------- */

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

function toDate(v?: Date | number | string): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function defaultFormatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(d);
}

function scrollIntoViewSafe(el: HTMLElement | null | undefined, reduce: boolean) {
  // Scroll only the rail/marker's own scroll region — never the page.
  scrollIntoViewWithin(el, { smooth: !reduce });
}

function TypeGlyph({ type }: { type?: string }) {
  const key = (type ?? "").toLowerCase();
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const s = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (/doc|guide|manual|reference|kb/.test(key))
    return (
      <svg {...common}>
        <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" {...s} />
        <path d="M13 3v6h6M9 13h6M9 17h4" {...s} />
      </svg>
    );
  if (/paper|study|journal|research|arxiv|pdf/.test(key))
    return (
      <svg {...common}>
        <path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" {...s} />
        <path d="M15 2v5h5M9 13l2 2 4-4" {...s} />
      </svg>
    );
  if (/data|dataset|table|csv|db/.test(key))
    return (
      <svg {...common}>
        <ellipse cx="12" cy="6" rx="7" ry="3" {...s} />
        <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" {...s} />
      </svg>
    );
  if (/article|blog|post|news/.test(key))
    return (
      <svg {...common}>
        <path d="M4 5h16v14H4zM4 9h16M8 13h8M8 16h5" {...s} />
      </svg>
    );
  // Generic web page
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" {...s} />
      <path d="M4 12h16M12 4c2.4 2.1 2.4 13.9 0 16M12 4c-2.4 2.1-2.4 13.9 0 16" {...s} />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  return copied ? (
    <CheckIcon />
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline marker                                                               */
/* -------------------------------------------------------------------------- */

/**
 * CitationMarker — the inline `[n]` reference placed within the answer body.
 * Must render inside a <SourceCitationRail>. Renders `null` if the referenced
 * source id is unknown, so stale markers never break the layout.
 */
export function CitationMarker({ source, children, className }: CitationMarkerProps) {
  const ctx = React.useContext(RailContext);
  if (!ctx) {
    throw new Error("CitationMarker must be rendered inside <SourceCitationRail>.");
  }
  const src = ctx.sourcesById.get(source);
  const ref = React.useCallback(
    (el: HTMLButtonElement | null) => ctx.registerMarker(source, el),
    [ctx, source],
  );
  if (!src) return null;
  const active = ctx.activeId === source;

  return (
    <button
      ref={ref}
      type="button"
      data-active={active || undefined}
      aria-pressed={active}
      aria-label={`Citation ${src.index}: ${src.title}${active ? " (selected)" : ""}`}
      onClick={() => ctx.setActive(active ? null : source, "marker")}
      className={cn(
        "mx-0.5 inline-flex h-[1.35em] min-w-[1.35em] translate-y-[-0.28em] items-center justify-center gap-0.5 rounded-[5px] border px-1 align-baseline text-[0.72em] font-semibold leading-none no-underline outline-none transition-colors",
        "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-accent)]",
        "hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
        "data-[active]:border-transparent data-[active]:bg-[var(--color-accent)] data-[active]:text-[var(--color-accent-fg)] data-[active]:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-accent)_40%,transparent)]",
        className,
      )}
    >
      {children ?? src.index}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Rail source row                                                             */
/* -------------------------------------------------------------------------- */

const chip =
  "inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-px text-[10.5px] font-medium text-[var(--color-muted)]";

const footBtn =
  "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] font-medium text-[var(--color-muted)] outline-none transition-colors hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";

interface SourceRowProps {
  source: CitationSource;
  active: boolean;
  tabbable: boolean;
  variant: CitationLayout;
  showExcerpts: boolean;
  reduce: boolean;
  formatDate: (d: Date) => string;
  onSelect: (id: string) => void;
  onOpen?: (source: CitationSource) => void;
  registerSelect: (id: string, el: HTMLButtonElement | null) => void;
  registerItem: (id: string, el: HTMLElement | null) => void;
  onSelectKeyDown: (e: React.KeyboardEvent) => void;
}

function SourceRow({
  source,
  active,
  tabbable,
  variant,
  showExcerpts,
  reduce,
  formatDate,
  onSelect,
  onOpen,
  registerSelect,
  registerItem,
  onSelectKeyDown,
}: SourceRowProps) {
  const excerpt = useDisclosure({ idPrefix: "citation-excerpt" });
  // Give the excerpt panel its own descriptive name (drop the trigger-derived
  // aria-labelledby, which would otherwise win over aria-label).
  const { "aria-labelledby": _excerptLabelledBy, ...excerptPanelProps } = excerpt.panelProps;
  const { copied, copy } = useCopy();
  const dense = variant === "list";

  const published = toDate(source.publishedAt);
  const retrieved = toDate(source.retrievedAt);
  const relPct =
    typeof source.relevance === "number"
      ? Math.max(0, Math.min(100, Math.round(source.relevance * 100)))
      : null;
  const hasExcerpt = showExcerpts && Boolean(source.excerpt);

  const itemRef = React.useCallback((el: HTMLLIElement | null) => registerItem(source.id, el), [registerItem, source.id]);
  const selectRef = React.useCallback(
    (el: HTMLButtonElement | null) => registerSelect(source.id, el),
    [registerSelect, source.id],
  );

  return (
    <motion.li
      ref={itemRef}
      layout={reduce ? false : "position"}
      variants={reduce ? undefined : streamItemVariants}
      initial={reduce ? false : "initial"}
      animate="animate"
      exit={reduce ? undefined : "exit"}
      transition={{ duration: 0.26, ease: EASE }}
      data-active={active || undefined}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-[var(--color-surface)] transition-colors",
        active
          ? "border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_6%,var(--color-surface))]"
          : "border-[var(--color-border)]",
      )}
    >
      {/* Active accent bar — a shared, moving indicator (not colour alone). */}
      {active ? (
        <motion.span
          layoutId={reduce ? undefined : "citation-active-bar"}
          aria-hidden
          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--color-accent)]"
          transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
        />
      ) : null}

      {/* Select header — sets the active source. Siblings (excerpt / copy / open) are never nested inside it. */}
      <button
        ref={selectRef}
        type="button"
        tabIndex={tabbable ? 0 : -1}
        aria-current={active ? "true" : undefined}
        aria-label={`Citation ${source.index}, ${source.title}${active ? ", selected" : ""}`}
        onClick={() => onSelect(source.id)}
        onKeyDown={onSelectKeyDown}
        className={cn(
          "flex w-full items-start gap-2.5 pl-3.5 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-inset",
          dense ? "py-2" : "py-2.5",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid shrink-0 place-items-center rounded-lg border text-[12px] font-semibold tabular-nums",
            active
              ? "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
              : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)]",
            dense ? "h-6 w-6" : "h-7 w-7",
          )}
          aria-hidden
        >
          {source.favicon ?? source.index}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-1.5">
            <span
              className={cn(
                "min-w-0 flex-1 font-medium text-[var(--color-fg)]",
                dense ? "truncate text-[13px]" : "text-[13.5px] leading-snug",
              )}
            >
              {source.title}
            </span>
            {active ? (
              <span className="mt-px shrink-0 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                Active
              </span>
            ) : null}
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11.5px] text-[var(--color-muted)]">
              <span className="text-[var(--color-muted)]">
                <TypeGlyph type={source.type} />
              </span>
              {source.domain ?? source.type ?? "source"}
            </span>
            {source.location ? <span className={chip}>{source.location}</span> : null}
            {source.verified !== undefined ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[10.5px] font-medium",
                  source.verified
                    ? "border-[color-mix(in_oklab,var(--color-success)_40%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)] text-[var(--color-success)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)]",
                )}
                title="Verification state provided by the application — not determined by this component."
              >
                {source.verified ? <CheckIcon /> : null}
                {source.verified ? "Verified" : "Unverified"}
                <span className="sr-only"> (app-provided)</span>
              </span>
            ) : null}
          </span>

          {(source.author || published) && !dense ? (
            <span className="mt-1 block text-[11.5px] text-[var(--color-muted)]">
              {source.author ? source.author : null}
              {source.author && published ? " · " : null}
              {published ? formatDate(published) : null}
            </span>
          ) : null}

          {relPct != null && !dense ? (
            <span className="mt-2 flex items-center gap-2">
              <span
                role="meter"
                aria-label={`Relevance provided by the application: ${relPct}%`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={relPct}
                className="relative h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)]"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)]"
                  initial={false}
                  animate={{ width: `${relPct}%` }}
                  transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE }}
                />
              </span>
              <span className="font-mono text-[10.5px] tabular-nums text-[var(--color-muted)]">{relPct}%</span>
            </span>
          ) : null}
        </span>
      </button>

      {/* Footer: excerpt toggle + copy link + open — all siblings of the select button. */}
      {(hasExcerpt || source.url) && !dense ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-[var(--color-border)] px-2 py-1.5">
          {hasExcerpt ? (
            <button type="button" {...excerpt.triggerProps} className={footBtn}>
              <span
                className={cn("grid h-3.5 w-3.5 place-items-center transition-transform", excerpt.open ? "rotate-90" : "")}
                aria-hidden
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {excerpt.open ? "Hide excerpt" : "Show excerpt"}
            </button>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            {source.url ? (
              <button
                type="button"
                onClick={() => copy(source.url!)}
                className={footBtn}
                aria-label={copied ? "Source link copied" : `Copy link to ${source.title}`}
              >
                <CopyIcon copied={copied} />
                {copied ? "Copied" : "Copy link"}
                <span aria-live="polite" className="sr-only">
                  {copied ? "Source link copied to clipboard" : ""}
                </span>
              </button>
            ) : null}
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpen?.(source)}
                aria-label={`Open ${source.title} in a new tab`}
                className={cn(
                  footBtn,
                  "text-[var(--color-accent)] hover:text-[var(--color-accent)] hover:underline",
                )}
              >
                Open
                <ExternalIcon />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Dense (list) layout keeps only the open link, inline. */}
      {dense && source.url ? (
        <div className="flex justify-end px-3 pb-2">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpen?.(source)}
            aria-label={`Open ${source.title} in a new tab`}
            className={cn(footBtn, "text-[var(--color-accent)] hover:underline")}
          >
            Open
            <ExternalIcon />
          </a>
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {hasExcerpt && excerpt.open ? (
          <motion.div
            key="excerpt"
            {...excerptPanelProps}
            aria-label={`Excerpt from ${source.title}`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
            className="overflow-hidden"
          >
            <figure className="mx-3 mb-3 rounded-lg border-l-2 border-[var(--color-accent)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
              <blockquote className="text-[12.5px] leading-relaxed text-[var(--color-fg)]">
                {source.excerpt}
              </blockquote>
              {retrieved ? (
                <figcaption className="mt-1.5 text-[11px] text-[var(--color-muted)]">
                  Provided by the app · {formatDate(retrieved)}
                </figcaption>
              ) : null}
            </figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export function SourceCitationRail({
  sources,
  children,
  activeSourceId,
  defaultActiveSourceId = null,
  onActiveSourceChange,
  onOpenSource,
  layout = "rail",
  showExcerpts = true,
  title = "Sources",
  mobileBehavior = "stacked",
  formatDate = defaultFormatDate,
  renderSource,
  className,
}: SourceCitationRailProps) {
  const reduce = useReducedMotion();
  const isControlled = activeSourceId !== undefined;
  const [internalActive, setInternalActive] = React.useState<string | null>(defaultActiveSourceId);
  const activeId = isControlled ? activeSourceId ?? null : internalActive;

  const sourcesById = React.useMemo(() => {
    const m = new Map<string, CitationSource>();
    for (const s of sources) m.set(s.id, s);
    return m;
  }, [sources]);

  const markerRefs = React.useRef<Map<string, HTMLElement>>(new Map());
  const railItemRefs = React.useRef<Map<string, HTMLElement>>(new Map());
  const selectRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastOrigin = React.useRef<"marker" | "rail" | "external">("external");

  const registerMarker = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) markerRefs.current.set(id, el);
    else markerRefs.current.delete(id);
  }, []);
  const registerItem = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) railItemRefs.current.set(id, el);
    else railItemRefs.current.delete(id);
  }, []);
  const registerSelect = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) selectRefs.current.set(id, el);
    else selectRefs.current.delete(id);
  }, []);

  const setActive = React.useCallback(
    (id: string | null, origin: "marker" | "rail" | "external" = "external") => {
      lastOrigin.current = origin;
      if (!isControlled) setInternalActive(id);
      onActiveSourceChange?.(id);
    },
    [isControlled, onActiveSourceChange],
  );

  // Keep marker ↔ rail in sync when the active source changes (either direction).
  // Skip the first run so we never scroll on mount.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (activeId == null) return;
    const raf =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(() => {
            scrollIntoViewSafe(railItemRefs.current.get(activeId), reduce);
            if (lastOrigin.current === "rail") scrollIntoViewSafe(markerRefs.current.get(activeId), reduce);
          })
        : null;
    return () => {
      if (raf != null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
    };
  }, [activeId, reduce]);

  const ctx = React.useMemo<RailContextValue>(
    () => ({ activeId, setActive, sourcesById, registerMarker, reduce }),
    [activeId, setActive, sourcesById, registerMarker, reduce],
  );

  // Roving Up/Down/Home/End selection across the rail.
  const onSelectKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const ids = sources.map((s) => s.id);
      if (ids.length === 0) return;
      const cur = activeId && ids.includes(activeId) ? ids.indexOf(activeId) : -1;
      let next: number;
      if (e.key === "Home") next = 0;
      else if (e.key === "End") next = ids.length - 1;
      else if (e.key === "ArrowDown") next = cur < 0 ? 0 : Math.min(ids.length - 1, cur + 1);
      else next = cur < 0 ? ids.length - 1 : Math.max(0, cur - 1);
      const nid = ids[next];
      setActive(nid, "rail");
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => selectRefs.current.get(nid)?.focus());
      else selectRefs.current.get(nid)?.focus();
    },
    [sources, activeId, setActive],
  );

  const tabbableId = activeId && sourcesById.has(activeId) ? activeId : sources[0]?.id;

  const railBody =
    sources.length === 0 ? (
      <p className="px-3 py-6 text-center text-[12.5px] text-[var(--color-muted)]">No sources provided.</p>
    ) : (
      <ol
        className={cn(
          "gap-2 p-2",
          layout === "cards" ? "grid sm:grid-cols-2" : "flex flex-col",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {sources.map((source) => {
            const active = source.id === activeId;
            if (renderSource) {
              return (
                <li key={source.id} ref={(el) => registerItem(source.id, el)} data-active={active || undefined}>
                  {renderSource(source, { active })}
                </li>
              );
            }
            return (
              <SourceRow
                key={source.id}
                source={source}
                active={active}
                tabbable={source.id === tabbableId}
                variant={layout}
                showExcerpts={showExcerpts}
                reduce={reduce}
                formatDate={formatDate}
                onSelect={(id) => setActive(active ? null : id, "rail")}
                onOpen={onOpenSource}
                registerSelect={registerSelect}
                registerItem={registerItem}
                onSelectKeyDown={onSelectKeyDown}
              />
            );
          })}
        </AnimatePresence>
      </ol>
    );

  const rail = (
    <nav
      aria-label={title}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
        layout === "rail" ? "md:sticky md:top-4 md:max-h-[calc(100vh-2rem)]" : "",
        mobileBehavior === "bottom"
          ? "max-md:sticky max-md:bottom-0 max-md:z-10 max-md:max-h-[46vh] max-md:rounded-b-none max-md:border-b-0 max-md:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)]"
          : "",
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 7h9M9 12h9M9 17h6M4.5 7h.01M4.5 12h.01M4.5 17h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-[12.5px] font-semibold text-[var(--color-fg)]">{title}</span>
        <span className="ml-auto rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)]">
          {sources.length}
        </span>
      </div>
      <div className={cn(layout === "rail" ? "md:overflow-y-auto" : "", mobileBehavior === "bottom" ? "max-md:overflow-y-auto" : "")}>
        {railBody}
      </div>
    </nav>
  );

  return (
    <RailContext.Provider value={ctx}>
      <div
        className={cn(
          "w-full",
          layout === "rail"
            ? "grid gap-5 md:grid-cols-[minmax(0,1fr)_clamp(240px,32%,330px)] md:items-start"
            : "flex flex-col gap-5",
          className,
        )}
      >
        <div className="min-w-0 text-[var(--color-fg)]">{children}</div>
        {rail}
      </div>
    </RailContext.Provider>
  );
}

export default SourceCitationRail;
