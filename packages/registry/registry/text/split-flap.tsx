"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** One board page: a single ticker line, or an array of rows. */
export type SplitFlapMessage = string | string[];

export interface SplitFlapStagger {
  /** ms added per column — sweeps the wave left to right. */
  col: number;
  /** ms added per row — sweeps it top to bottom. */
  row: number;
  /** ms of random spread so the sweep never reads as a grid. */
  jitter: number;
}

export interface SplitFlapProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Pages the board rotates through. A string is a one-row page. */
  messages: SplitFlapMessage[];
  /** Cells per row. Defaults to the longest line in `messages`. */
  cols?: number;
  /** ms each page is held before the next one flips in. `0` disables rotation. */
  interval?: number;
  /** ms for one drum step. The final step of a run runs longer, with a back-ease slap. */
  flipMs?: number;
  /** Per-column / per-row / random offsets that shape the board-wide sweep. */
  stagger?: SplitFlapStagger;
  /** Drum contents. Characters outside it fall back to a blank. */
  charset?: string;
  /** Random idle twitches on settled cells. */
  flutter?: boolean;
  /** Controlled page index. */
  index?: number;
  /** Uncontrolled initial page index. */
  defaultIndex?: number;
  /** Fires with the page index whenever the board changes page. */
  onIndexChange?: (index: number) => void;
  /** Deterministic seed for jitter + twitches (SSR-stable). */
  seed?: number;
  /** Force the static variant: pages swap as instant text, nothing flips. */
  reducedMotion?: boolean;
}

interface Cell {
  el: HTMLElement;
  /** Glyph nodes: the resting top/bottom halves and the two moving flaps. */
  topText: HTMLElement;
  bottomText: HTMLElement;
  topFlapText: HTMLElement;
  bottomFlapText: HTMLElement;
  /** Transform targets: the flap halves themselves. */
  topFlap: HTMLElement;
  bottomFlap: HTMLElement;
  r: number;
  c: number;
  cur: number;
  next: number;
  phase: "idle" | "wait" | "flip" | "twitch";
  startAt: number;
  prog: number;
  dur: number;
  stepsLeft: number;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—-:/";
const DEFAULT_STAGGER: SplitFlapStagger = { col: 38, row: 110, jitter: 90 };
/** Real drums never spin more than a handful of steps — long runs start closer. */
const MAX_STEPS = 14;
/** The last step runs longer so the back-ease slap is readable (seconds). */
const FINAL_STEP_S = 0.15;
/** Above this many remaining steps the moving flap gets motion blur. */
const FAST_STEPS = 2;
/** Average seconds between idle twitches somewhere on the board. */
const TWITCH_EVERY = 1.4;
const TWITCH_S = 0.16;
/** Cell box metrics (em) — must match the injected CSS. */
const CELL_W_EM = 1.18;
const CELL_GAP_PX = 3;
const BOARD_PAD_PX = 28;
const MIN_FONT_PX = 8;
const MAX_FONT_PX = 20;

/** mulberry32 — no Math.random at render or module scope (SSR-stable). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** easeOutBack — the flap slaps past flat and settles. */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const y = x - 1;
  return 1 + c3 * y * y * y + c1 * y * y;
}

function toRows(message: SplitFlapMessage): string[] {
  return Array.isArray(message) ? message : [message];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * SplitFlap — an airport departures board that actually flips.
 *
 * Each cell steps *through the charset in order* to its target like a real
 * drum (long runs restart closer so nothing spins more than 14 steps). One flip
 * is a top flap rotating `0 → −90°` handing off to a bottom flap `90° → 0`
 * behind a 320px perspective; the final step runs longer with a back-ease slap.
 * A `col·38 + row·110 ± 90ms` stagger sweeps the change across the board, fast
 * runs blur the moving flap only, and settled cells twitch at random.
 *
 * The board is `aria-hidden`; a polite live region announces each page as one
 * sentence once it has settled. Under reduced motion pages swap as instant text
 * — the content still rotates, nothing flips. One rAF loop drives every cell,
 * glyphs are written at flip boundaries (never per frame), and the loop parks
 * completely offscreen. Clean-room original.
 */
export function SplitFlap({
  messages,
  cols,
  interval = 6000,
  flipMs = 80,
  stagger = DEFAULT_STAGGER,
  charset = DEFAULT_CHARSET,
  flutter = true,
  index,
  defaultIndex = 0,
  onIndexChange,
  seed = 1,
  reducedMotion,
  className,
  ...rest
}: SplitFlapProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const cellsRef = React.useRef<Cell[]>([]);
  const rafRef = React.useRef<number | null>(null);
  const pendingRef = React.useRef<string | null>(null);
  const rngRef = React.useRef(makeRng(seed));

  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const scope = `mk-sf-${uid}`;

  const systemReduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Behaviour reads the live preference immediately (effects are client-only);
  // the RENDERED attribute waits for mount so SSR markup can never disagree.
  const reduceNow = reducedMotion ?? systemReduced;
  const reduce = reducedMotion ?? (mounted ? systemReduced : false);

  const visible = useVisibilityPause(rootRef, { threshold: 0.12 });

  const [page, setPage] = useControllableState<number>({
    value: index,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  });

  const pages = React.useMemo(() => (messages.length > 0 ? messages.map(toRows) : [[""]]), [messages]);
  const rowCount = React.useMemo(() => Math.max(1, ...pages.map((p) => p.length)), [pages]);
  const colCount = React.useMemo(() => {
    if (cols && cols > 0) return Math.floor(cols);
    return Math.max(1, ...pages.flatMap((p) => p.map((row) => row.length)));
  }, [cols, pages]);

  const safePage = ((page % pages.length) + pages.length) % pages.length;

  /** Row text padded/truncated to the board width, in charset space. */
  const rowsFor = React.useCallback(
    (idx: number) => {
      const src = pages[idx] ?? [""];
      const out: string[] = [];
      for (let r = 0; r < rowCount; r += 1) {
        const raw = (src[r] ?? "").toUpperCase().slice(0, colCount);
        out.push(raw.padEnd(colCount, " "));
      }
      return out;
    },
    [colCount, pages, rowCount],
  );

  const announcement = React.useMemo(
    () =>
      rowsFor(safePage)
        .map((row) => row.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("; "),
    [rowsFor, safePage],
  );
  const [announced, setAnnounced] = React.useState("");

  /* ---- Cell model: built from the rendered DOM once per board shape ------- */
  React.useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const nodes = Array.from(board.querySelectorAll<HTMLElement>("[data-mk-cell]"));
    const model: Cell[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      const halves = Array.from(el.querySelectorAll<HTMLElement>("[data-mk-half]"));
      const glyphs = Array.from(el.querySelectorAll<HTMLElement>("[data-mk-glyph]"));
      if (halves.length < 4 || glyphs.length < 4) continue;
      model.push({
        el,
        topText: glyphs[0],
        bottomText: glyphs[1],
        topFlapText: glyphs[2],
        bottomFlapText: glyphs[3],
        topFlap: halves[2],
        bottomFlap: halves[3],
        r: Math.floor(i / colCount),
        c: i % colCount,
        cur: 0,
        next: 0,
        phase: "idle",
        startAt: 0,
        prog: 0,
        dur: FINAL_STEP_S,
        stepsLeft: 0,
      });
    }
    cellsRef.current = model;
  }, [colCount, rowCount]);

  /* ---- Board sizing: font-size follows the container, measured on resize -- */
  const [fontPx, setFontPx] = React.useState(16);
  React.useEffect(() => {
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === "undefined") return;
    const fit = (width: number) => {
      if (width <= 0) return;
      const usable = width - BOARD_PAD_PX - CELL_GAP_PX * (colCount - 1);
      const next = Math.max(MIN_FONT_PX, Math.min(MAX_FONT_PX, usable / (colCount * CELL_W_EM)));
      setFontPx((prev) => (Math.abs(prev - next) < 0.25 ? prev : next));
    };
    fit(board.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) fit(entry.contentRect.width + BOARD_PAD_PX);
    });
    ro.observe(board);
    return () => ro.disconnect();
  }, [colCount]);

  const settleCell = React.useCallback((cell: Cell) => {
    cell.phase = "idle";
    cell.topFlap.style.visibility = "hidden";
    cell.bottomFlap.style.visibility = "hidden";
    cell.el.dataset.fast = "0";
  }, []);

  /* ---- Page application -------------------------------------------------- */
  const applyPage = React.useCallback(
    (idx: number, instant: boolean) => {
      const cells = cellsRef.current;
      if (cells.length === 0) return;
      const rows = rowsFor(idx);
      const rng = rngRef.current;
      const now = typeof performance !== "undefined" ? performance.now() : 0;
      const charAt = (ch: string) => {
        const at = charset.indexOf(ch);
        return at < 0 ? 0 : at;
      };

      for (const cell of cells) {
        const ch = rows[cell.r]?.charAt(cell.c) ?? " ";
        const target = charAt(ch);
        if (cell.phase !== "idle") settleCell(cell);
        if (instant) {
          cell.cur = target;
          cell.stepsLeft = 0;
          cell.topText.textContent = charset.charAt(target);
          cell.bottomText.textContent = charset.charAt(target);
          settleCell(cell);
          continue;
        }
        let steps = (target - cell.cur + charset.length) % charset.length;
        if (steps === 0) continue;
        if (steps > MAX_STEPS) {
          // Restart the drum closer to the target — real boards never spin far.
          cell.cur = (target - 8 - ((rng() * 4) | 0) + charset.length) % charset.length;
          cell.topText.textContent = charset.charAt(cell.cur);
          cell.bottomText.textContent = charset.charAt(cell.cur);
          steps = (target - cell.cur + charset.length) % charset.length;
        }
        cell.stepsLeft = steps;
        cell.startAt = now + cell.c * stagger.col + cell.r * stagger.row + rng() * stagger.jitter;
        cell.phase = "wait";
      }
    },
    [charset, rowsFor, settleCell, stagger.col, stagger.jitter, stagger.row],
  );

  // Apply the current page whenever it (or the motion mode) changes.
  React.useEffect(() => {
    if (cellsRef.current.length === 0) return;
    if (reduceNow) {
      applyPage(safePage, true);
      setAnnounced(announcement);
      pendingRef.current = null;
      return;
    }
    applyPage(safePage, false);
    pendingRef.current = announcement;
  }, [announcement, applyPage, reduceNow, safePage]);

  /* ---- Auto-rotation ----------------------------------------------------- */
  React.useEffect(() => {
    if (!visible || interval <= 0 || pages.length <= 1) return;
    const id = setTimeout(() => setPage((safePage + 1) % pages.length), interval);
    return () => clearTimeout(id);
  }, [interval, pages.length, safePage, setPage, visible]);

  /* ---- The single rAF loop ----------------------------------------------- */
  React.useEffect(() => {
    if (reduceNow || !visible) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const cells = cellsRef.current;
    if (cells.length === 0) return;
    const rng = rngRef.current;
    const stepS = Math.max(0.016, flipMs / 1000);
    let last = performance.now();
    let flutterClock = 0;

    const beginStep = (cell: Cell) => {
      cell.next = (cell.cur + 1) % charset.length;
      cell.topText.textContent = charset.charAt(cell.next);
      cell.topFlapText.textContent = charset.charAt(cell.cur);
      cell.bottomFlapText.textContent = charset.charAt(cell.next);
      cell.prog = 0;
      cell.dur = cell.stepsLeft <= 1 ? FINAL_STEP_S : stepS;
      cell.phase = "flip";
      cell.el.dataset.fast = cell.stepsLeft > FAST_STEPS ? "1" : "0";
    };

    const renderFlip = (cell: Cell) => {
      const p = cell.prog / cell.dur;
      if (p >= 1) {
        cell.cur = cell.next;
        cell.bottomText.textContent = charset.charAt(cell.cur);
        cell.stepsLeft -= 1;
        if (cell.stepsLeft > 0) beginStep(cell);
        else settleCell(cell);
        return;
      }
      const isFinal = cell.stepsLeft <= 1;
      if (p < 0.5) {
        cell.topFlap.style.visibility = "visible";
        cell.bottomFlap.style.visibility = "hidden";
        cell.topFlap.style.transform = `rotateX(${(-(p * 2 * 90)).toFixed(1)}deg)`;
      } else {
        let q = (p - 0.5) * 2;
        if (isFinal) q = easeOutBack(q);
        cell.topFlap.style.visibility = "hidden";
        cell.bottomFlap.style.visibility = "visible";
        cell.bottomFlap.style.transform = `rotateX(${(90 * (1 - q)).toFixed(1)}deg)`;
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      if (flutter) {
        flutterClock += dt;
        if (flutterClock > TWITCH_EVERY) {
          flutterClock = 0;
          const cell = cells[(rng() * cells.length) | 0];
          if (cell && cell.phase === "idle") {
            cell.phase = "twitch";
            cell.prog = 0;
            cell.topFlapText.textContent = charset.charAt(cell.cur);
            cell.topText.textContent = charset.charAt(cell.cur);
          }
        }
      }

      let busy = false;
      for (const cell of cells) {
        if (cell.phase === "wait") {
          busy = true;
          if (now >= cell.startAt) beginStep(cell);
        } else if (cell.phase === "flip") {
          busy = true;
          cell.prog += dt;
          renderFlip(cell);
        } else if (cell.phase === "twitch") {
          cell.prog += dt;
          const p = cell.prog / TWITCH_S;
          if (p >= 1) {
            settleCell(cell);
          } else {
            cell.topFlap.style.visibility = "visible";
            cell.topFlap.style.transform = `rotateX(${(-14 * Math.sin(Math.PI * p)).toFixed(1)}deg)`;
          }
        }
      }

      // The page is announced only once every cell has come to rest.
      if (!busy && pendingRef.current !== null) {
        const text = pendingRef.current;
        pendingRef.current = null;
        setAnnounced(text);
      }

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [charset, flipMs, flutter, reduceNow, settleCell, visible]);

  /* ---- Markup ------------------------------------------------------------ */
  const css = `
.${scope} [data-mk-cell]{position:relative;display:block;width:${CELL_W_EM}em;height:1.62em;perspective:320px;flex:0 0 auto;font-family:var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);font-weight:600;}
.${scope} [data-mk-cell]::after{content:"";position:absolute;top:calc(50% - .5px);left:0;right:0;height:1px;background:color-mix(in oklab, var(--color-bg, #080c14) 78%, transparent);z-index:6;pointer-events:none;}
.${scope} [data-mk-half]{position:absolute;left:0;right:0;height:50%;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:linear-gradient(180deg, var(--color-surface-2, #192337), color-mix(in oklab, var(--color-surface-2, #192337) 68%, var(--color-bg, #080c14)));}
.${scope} [data-mk-half][data-side="top"]{top:0;border-radius:3px 3px 0 0;transform-origin:50% 100%;}
.${scope} [data-mk-half][data-side="bottom"]{bottom:0;border-radius:0 0 3px 3px;transform-origin:50% 0%;background:linear-gradient(180deg, color-mix(in oklab, var(--color-surface-2, #192337) 78%, var(--color-bg, #080c14)), var(--color-surface-2, #192337) 60%);}
/* The glyph box is twice the half's height and centred, so both halves show the
   two matching pieces of ONE character — that split is the whole illusion. */
.${scope} [data-mk-glyph]{position:absolute;left:0;width:100%;height:200%;display:flex;align-items:center;justify-content:center;color:var(--color-fg, #f8fafc);}
.${scope} [data-mk-half][data-side="top"] [data-mk-glyph]{top:0;}
.${scope} [data-mk-half][data-side="bottom"] [data-mk-glyph]{top:-100%;}
.${scope} [data-mk-half][data-flap="1"]{z-index:4;visibility:hidden;will-change:transform;}
.${scope} [data-mk-half][data-flap="1"][data-side="top"]{box-shadow:0 1px 3px color-mix(in oklab, var(--color-bg, #080c14) 60%, transparent);}
.${scope} [data-mk-cell][data-fast="1"] [data-mk-half][data-flap="1"]{opacity:.92;}
.${scope} [data-mk-cell][data-fast="1"] [data-mk-half][data-flap="1"] [data-mk-glyph]{filter:blur(.7px);}
`;

  const rows = rowsFor(safePage);

  return (
    <div ref={rootRef} className={cn("w-full", className)} data-motion={reduce ? "static" : "animated"} {...rest}>
      <style>{css}</style>
      {/* The settled page, announced politely — the board itself is decorative. */}
      <p className="sr-only" aria-live="polite">
        {announced}
      </p>
      <div
        ref={boardRef}
        aria-hidden="true"
        className={cn(scope, "flex w-full select-none flex-col items-center gap-[7px] rounded-[10px] border px-[14px] py-4")}
        style={{
          fontSize: `${fontPx.toFixed(2)}px`,
          borderColor: "var(--color-border-strong, #354863)",
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-fg, #f8fafc) 4%, transparent), transparent 30%), var(--color-surface, #111827)",
        }}
      >
        {rows.map((_row, r) => (
          <div key={r} className="flex justify-center" style={{ gap: `${CELL_GAP_PX}px` }}>
            {Array.from({ length: colCount }, (_, c) => (
              <span key={c} data-mk-cell={`${r}-${c}`} data-fast="0">
                <span data-mk-half="" data-side="top" data-flap="0">
                  <span data-mk-glyph="">{" "}</span>
                </span>
                <span data-mk-half="" data-side="bottom" data-flap="0">
                  <span data-mk-glyph="">{" "}</span>
                </span>
                <span data-mk-half="" data-side="top" data-flap="1">
                  <span data-mk-glyph="" />
                </span>
                <span data-mk-half="" data-side="bottom" data-flap="1">
                  <span data-mk-glyph="" />
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

SplitFlap.displayName = "SplitFlap";

export default SplitFlap;
