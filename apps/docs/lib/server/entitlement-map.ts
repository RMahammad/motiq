// SERVER-ONLY canonical mapping: registry item ⇄ entitlement ⇄ pack/catalog.
// ONE source of truth so webhook handlers, checkout, the registry route, and the
// portal never disagree. Derived from the catalog + packs (no duplication).
import { catalog } from "../catalog";
import { packs } from "../packs";
import type { EntitlementId } from "../commerce";

/** All Pro registry item names (Pro components + blocks + packs). */
export function proRegistryItems(): string[] {
  return catalog.filter((c) => c.access === "pro").map((c) => c.registryItem);
}

/** Every entitlement that grants a given registry item (any one suffices). */
export function entitlementsThatGrant(itemName: string): EntitlementId[] {
  const grants: EntitlementId[] = ["catalog.complete"]; // complete catalog grants everything
  for (const p of packs) {
    if (p.components.includes(itemName) || p.blockSlug === itemName || p.packRegistryItem === itemName) {
      grants.push(`pack.${p.slug}` as EntitlementId);
      grants.push(`block.${p.blockSlug}` as EntitlementId);
    }
  }
  grants.push(`component.${itemName}` as EntitlementId); // individual (if enabled)
  return Array.from(new Set(grants));
}

/** Which packs contain an item (for portal + pack-page display). */
export function packsContaining(itemName: string): string[] {
  return packs
    .filter((p) => p.components.includes(itemName) || p.blockSlug === itemName || p.packRegistryItem === itemName)
    .map((p) => p.slug);
}

export interface EntitlementMapRow {
  item: string;
  access: "free" | "pro";
  kind: "component" | "block" | "pack";
  packs: string[];
  inCompleteCatalog: boolean;
  grantedBy: EntitlementId[];
}

/** The full mapping table (Pro items only carry entitlement coverage). */
export function entitlementMap(): EntitlementMapRow[] {
  return catalog.map((c) => ({
    item: c.registryItem,
    access: c.access,
    kind: c.kind ?? "component",
    packs: packsContaining(c.registryItem),
    inCompleteCatalog: true, // the complete catalog includes everything
    grantedBy: c.access === "pro" ? entitlementsThatGrant(c.registryItem) : [],
  }));
}

export interface MapValidation {
  ok: boolean;
  problems: string[]; // hard failures — block launch
  warnings: string[]; // advisory — e.g. Pro items sold only via complete catalog
}

/**
 * Validate the mapping. FAILS when a Pro item has no granting entitlement at all
 * (should be impossible while catalog.complete exists) or is somehow excluded
 * from the complete catalog. WARNS for Pro items in no pack (reachable only via
 * complete catalog or an individual purchase) so the owner can decide packaging.
 */
export function validateEntitlementMap(): MapValidation {
  const problems: string[] = [];
  const warnings: string[] = [];
  for (const row of entitlementMap()) {
    if (row.access !== "pro") continue;
    if (row.grantedBy.length === 0) problems.push(`${row.item}: Pro item has NO granting entitlement`);
    if (!row.inCompleteCatalog) problems.push(`${row.item}: Pro item not covered by the complete catalog`);
    if (row.kind === "component" && row.packs.length === 0) {
      warnings.push(`${row.item}: Pro component is in no pack — reachable only via complete-catalog or individual purchase`);
    }
  }
  return { ok: problems.length === 0, problems, warnings };
}
