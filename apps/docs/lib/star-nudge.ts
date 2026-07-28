// Policy for the "star the repo" prompt.
//
// The prompt exists to convert people who are already getting value, so it is
// earned rather than immediate: it never appears on a first visit, only after a
// real usage signal, at most once per session, and never again once the visitor
// has starred or declined twice. That restraint is the point — an ask that fires
// on arrival trains people to dismiss it, which costs more stars than it wins.
//
// All state lives in localStorage on the visitor's own device. Nothing is sent
// anywhere, and nothing here identifies a person.

const STORAGE_KEY = "motiq:star-nudge";
const STATE_VERSION = 1;

/** Stop asking after this many declines — a third ask is nagging, not marketing. */
const MAX_DISMISSALS = 2;
/** Days of silence after a decline. */
const COOLDOWN_DAYS = 45;
/** Browsing signals needed before the prompt is allowed (an install copy bypasses this). */
const SIGNALS_REQUIRED = 4;

const DAY_MS = 86_400_000;

/** What just happened. `install` is the strongest intent signal we can observe. */
export type StarSignal = "install" | "browse";

export interface NudgeState {
  v: number;
  /** The visitor clicked a star CTA — never prompt again. */
  starred: boolean;
  dismissals: number;
  /** Epoch ms of the last dismissal, for the cooldown. */
  dismissedAt: number;
  /** Count of qualifying browsing signals across visits. */
  signals: number;
}

const EMPTY: NudgeState = { v: STATE_VERSION, starred: false, dismissals: 0, dismissedAt: 0, signals: 0 };

function storage(): Storage | null {
  // Private-mode Safari and blocked-storage contexts throw on access, not on use.
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readNudgeState(): NudgeState {
  const store = storage();
  if (!store) return { ...EMPTY };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<NudgeState>;
    if (parsed.v !== STATE_VERSION) return { ...EMPTY };
    return {
      v: STATE_VERSION,
      starred: parsed.starred === true,
      dismissals: typeof parsed.dismissals === "number" ? parsed.dismissals : 0,
      dismissedAt: typeof parsed.dismissedAt === "number" ? parsed.dismissedAt : 0,
      signals: typeof parsed.signals === "number" ? parsed.signals : 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

function writeNudgeState(next: NudgeState): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or denied — the prompt degrades to "shows once per session".
  }
}

/** Record that the visitor starred (or opened the repo to star). Suppresses every future prompt. */
export function markStarred(): void {
  writeNudgeState({ ...readNudgeState(), starred: true });
}

/** Record a decline and start the cooldown. */
export function markDismissed(): void {
  const state = readNudgeState();
  writeNudgeState({ ...state, dismissals: state.dismissals + 1, dismissedAt: Date.now() });
}

/**
 * Record a signal and report whether the prompt has now been earned. Browsing
 * signals accumulate across visits; an install copy qualifies on its own.
 */
export function recordSignal(kind: StarSignal): boolean {
  const state = readNudgeState();
  const signals = state.signals + 1;
  writeNudgeState({ ...state, signals });

  if (state.starred) return false;
  if (state.dismissals >= MAX_DISMISSALS) return false;
  if (state.dismissedAt && Date.now() - state.dismissedAt < COOLDOWN_DAYS * DAY_MS) return false;
  if (kind === "install") return true;
  return signals >= SIGNALS_REQUIRED;
}

/* -------------------------------------------------------------------------- *
 * Signal bus — a window event so any client component (an install copy button,
 * a preview interaction) can report intent without the prompt having to be its
 * parent or share React state with it.
 * -------------------------------------------------------------------------- */

const SIGNAL_EVENT = "motiq:star-signal";

export function emitStarSignal(kind: StarSignal): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<StarSignal>(SIGNAL_EVENT, { detail: kind }));
}

export function onStarSignal(handler: (kind: StarSignal) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<StarSignal>).detail ?? "browse");
  window.addEventListener(SIGNAL_EVENT, listener);
  return () => window.removeEventListener(SIGNAL_EVENT, listener);
}
