// SERVER-ONLY release-version model.
//
// A small, in-repo source of truth for release versions of catalog items
// (components, blocks, packs) and the complete catalog. This is intentionally
// NOT a package manager: it records what version an item is at, when it was
// released, what changed, and whether the change was breaking. Delivery
// (lib/server/download.ts) and the customer-facing Updates page read from here.
//
// Determinism rule: every date is an ISO STRING CONSTANT. There is no
// `Date.now()` / `new Date()` at module scope, so the versioning table renders
// identically on every build. Runtime comparisons parse these constant strings.
import type { EntitlementRecord } from "./model";

/** The catalog-wide release identity (one entry covers "everything at once"). */
export const CATALOG_COMPLETE = "catalog.complete" as const;

/** Default version every catalog item starts at until it is bumped here. */
export const DEFAULT_VERSION = "0.1.0" as const;

export interface ReleaseEntry {
  /** A registry item name, or the literal "catalog.complete" for the whole catalog. */
  itemName: string;
  /** Semantic version string, e.g. "0.1.0". */
  version: string;
  /** ISO date CONSTANT (never Date.now) — the day this version was released. */
  releaseDate: string;
  /** Human-readable, ordered list of what changed in this version. */
  changelog: string[];
  /** Whether this release contains a breaking change (consumer action required). */
  breaking: boolean;
  /** Migration guidance when `breaking` is true. */
  migrationNote?: string;
  /** Minimum peer/runtime dependency versions this release expects. */
  minDeps?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// The releases table. Seeded with a single 0.1.0 baseline for the complete
// catalog. Per-item versions default to DEFAULT_VERSION (0.1.0) until an item
// gets its own bumped entry here — so a single baseline row is enough for v0.1.0.
// ---------------------------------------------------------------------------
export const releases: readonly ReleaseEntry[] = [
  {
    itemName: CATALOG_COMPLETE,
    version: "0.1.0",
    releaseDate: "2026-07-14",
    changelog: [
      "Initial 0.1.0 baseline: accessible, reduced-motion-safe, RSC-safe catalog.",
      "All components, blocks, and packs ship at version 0.1.0.",
      "Entitlement-aware protected registry + signed, short-lived download delivery.",
    ],
    breaking: false,
    minDeps: {
      react: ">=18.2.0",
      next: ">=14.0.0",
    },
  },
] as const;

/** The catalog-wide baseline entry (always present). */
export function catalogBaseline(): ReleaseEntry {
  const base = releases.find((r) => r.itemName === CATALOG_COMPLETE);
  // The table always seeds this; fall back defensively so callers never crash.
  return (
    base ?? {
      itemName: CATALOG_COMPLETE,
      version: DEFAULT_VERSION,
      releaseDate: "2026-07-14",
      changelog: ["Baseline"],
      breaking: false,
    }
  );
}

/** The release entry for an item, or null when the item has no own entry. */
export function releaseFor(itemName: string): ReleaseEntry | null {
  return releases.find((r) => r.itemName === itemName) ?? null;
}

/**
 * The current version string for an item. Items without an explicit entry
 * default to the baseline version (0.1.0) — they inherit the catalog baseline.
 */
export function currentVersion(itemName: string): string {
  const own = releaseFor(itemName);
  if (own) return own.version;
  return catalogBaseline().version;
}

/**
 * The effective release entry an item ships under: its own entry, or a synthetic
 * baseline entry derived from the catalog baseline (so downloads/pages always
 * have version + releaseDate metadata for every item).
 */
export function effectiveRelease(itemName: string): ReleaseEntry {
  const own = releaseFor(itemName);
  if (own) return own;
  const base = catalogBaseline();
  return {
    itemName,
    version: base.version,
    releaseDate: base.releaseDate,
    changelog: base.changelog,
    breaking: false,
    minDeps: base.minDeps,
  };
}

/**
 * Whether a customer's entitlement still covers the CURRENT release of an item.
 * Compares the entitlement's update-window end (`updateUntil`, ms epoch) to the
 * item's release date (an ISO constant). A null window means no cutoff has been
 * set, so the release is covered. A release dated on/before the window end is
 * covered; a release AFTER the window end is not (update window has lapsed).
 *
 * Deterministic: `updateUntil` is caller-provided data; `releaseDate` is a
 * constant parsed here. No `Date.now()` is used.
 */
export function updateEligible(
  entitlement: Pick<EntitlementRecord, "updateUntil">,
  itemName: string,
): boolean {
  const { updateUntil } = entitlement;
  if (updateUntil == null) return true; // no cutoff configured → covered
  const releasedAt = Date.parse(effectiveRelease(itemName).releaseDate);
  if (Number.isNaN(releasedAt)) return false; // fail closed on a bad date
  return releasedAt <= updateUntil;
}

/** All release rows, newest release date first (for the Updates page). */
export function allReleases(): ReleaseEntry[] {
  return [...releases].sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate));
}
