// SERVER-ONLY waitlist / access-request layer. Never import from a client component.
//
// Provider-neutral: the /api/access route calls this interface; a real email/CRM
// provider is plugged in later behind the same shape (docs/41 tracks that
// decision). The bundled adapter is a DEV MOCK backed by an in-memory Map — it is
// NOT external storage and NOT durable. Entries live only for the current server
// process and vanish on restart. No secrets live here. Never log full personal
// data from callers of this module.
import { commerce } from "../product";

/** Workflow packs a requester can express interest in (mirrors packs.ts slugs + "complete"). */
export type WaitlistPack = "ai-interface" | "developer-tools" | "collaboration" | "data-motion" | "complete";

/** Rough team-size buckets — coarse, non-identifying. */
export type WaitlistTeamSize = "solo" | "2-10" | "11-50" | "50+";

/** The fields an access request may carry. Only email is required.
 *  Deliberately NON-SENSITIVE: no payment, government-id, password, or similar. */
export interface WaitlistRequest {
  email: string;
  name?: string;
  /** Short free-text: what the visitor intends to build. */
  intendedUse?: string;
  interestedPack?: WaitlistPack;
  teamSize?: WaitlistTeamSize;
  /** Optional free-text note. */
  message?: string;
  /** Consent flag. Required at the route only when commerce policy demands it. */
  consent?: boolean;
}

/** A stored access request (dev mock). */
export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  intendedUse?: string;
  interestedPack?: WaitlistPack;
  teamSize?: WaitlistTeamSize;
  message?: string;
  consent: boolean;
  /** Unix epoch ms when recorded (local dev only). */
  at: number;
}

/** Result of a submit attempt. */
export type WaitlistResult =
  | { status: "success"; id: string }
  | { status: "duplicate" }
  | { status: "error"; message: string };

export interface WaitlistProvider {
  readonly name: string;
  submit(req: WaitlistRequest): Promise<WaitlistResult>;
  list(): Promise<WaitlistEntry[]>;
}

// Basic email-shape check. Intentionally permissive — real validation/verification
// is the job of an approved provider, not this dev mock.
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function trimOrUndefined(value: string | undefined, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

// ---------------------------------------------------------------------------
// Development adapter — DEV MOCK ONLY. In-memory, not external storage.
// ---------------------------------------------------------------------------

// Keyed by lowercased email so the same address can't queue twice.
const devEntries = new Map<string, WaitlistEntry>();

const devStoreProvider: WaitlistProvider = {
  name: "dev-store",
  async submit(req) {
    const email = typeof req.email === "string" ? req.email.trim() : "";
    if (!email || !looksLikeEmail(email)) {
      return { status: "error", message: "Enter a valid email address." };
    }
    const key = email.toLowerCase();
    if (devEntries.has(key)) {
      return { status: "duplicate" };
    }
    const id = `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const entry: WaitlistEntry = {
      id,
      email,
      name: trimOrUndefined(req.name, 120),
      intendedUse: trimOrUndefined(req.intendedUse, 300),
      interestedPack: req.interestedPack,
      teamSize: req.teamSize,
      message: trimOrUndefined(req.message, 1000),
      consent: req.consent === true,
      at: Date.now(),
    };
    devEntries.set(key, entry);
    return { status: "success", id };
  },
  async list() {
    return [...devEntries.values()].sort((a, b) => b.at - a.at);
  },
};

/** Select the active waitlist provider from launch config. Only the dev-store
 *  exists today; real providers are plugged in once approved (docs/41). */
export function waitlistProvider(): WaitlistProvider {
  switch (commerce.waitlistProvider) {
    case "dev-store":
      return devStoreProvider;
    case "email":
    case "custom":
      throw new Error(`Waitlist provider "${commerce.waitlistProvider}" is not configured (docs/41).`);
    case "none":
      throw new Error('Waitlist provider "none" is not configured (docs/41).');
    default:
      // Unknown/unset → fall back to the dev mock so preview never dead-ends.
      return devStoreProvider;
  }
}
