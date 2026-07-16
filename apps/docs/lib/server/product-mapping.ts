// SERVER-ONLY canonical mapping: internal checkout item ⇄ entitlement ⇄ granted
// registry items. This is the ONE place that resolves "what a purchase buys".
//
// Provider-neutral by construction: rows are keyed by an INTERNAL `checkoutItemId`
// (e.g. "catalog.complete", "pack.ai-interface", "component.prompt-composer") — we
// do NOT invent provider (Stripe/Lemon/Paddle) product ids. When a real provider is
// approved (docs/41), its product ids are mapped ONTO these internal ids via a
// config/env table (providerProductToEntitlement) — never hardcoded here.
//
// Prices are intentionally absent: this module answers "what is granted", not "what
// it costs". Concrete prices come only from an approved provider (see checkout.ts).
import type { EntitlementId } from "../commerce";
import type { LicenseType } from "./model";
import { catalog } from "../catalog";
import { packs } from "../packs";
import { proRegistryItems, entitlementsThatGrant } from "./entitlement-map";

/** How long updates flow after purchase. Placeholder keys only — the concrete
 *  windows are a human policy decision (docs/45); no durations are asserted here. */
export type UpdatePolicyKey = "standard" | "extended" | "none";

export type CheckoutItemKind = "catalog" | "pack" | "component";

/** One purchasable internal line item. `entitlementId` is what a fulfilled
 *  purchase GRANTS; `registryItemsGranted` is the derived, human-readable list of
 *  registry items that entitlement unlocks (for portal/receipt display). */
export interface CheckoutItemDefinition {
  checkoutItemId: string;
  kind: CheckoutItemKind;
  entitlementId: EntitlementId;
  /** Display name (never a price). */
  name: string;
  licenseType: LicenseType;
  seatAllowance: number;
  /** Registry item names this checkout item unlocks (derived, not authored). */
  registryItemsGranted: string[];
  updatePolicyKey: UpdatePolicyKey;
}

// ---------------------------------------------------------------------------
// Table construction — derived from the catalog + packs so it can never drift
// from the entitlement map. Computed once (catalog/packs are static modules).
// ---------------------------------------------------------------------------
function buildTable(): CheckoutItemDefinition[] {
  const rows: CheckoutItemDefinition[] = [];

  // 1. Complete catalog — grants every Pro registry item.
  rows.push({
    checkoutItemId: "catalog.complete",
    kind: "catalog",
    entitlementId: "catalog.complete",
    name: "Complete catalog",
    licenseType: "personal",
    seatAllowance: 1,
    registryItemsGranted: proRegistryItems(),
    updatePolicyKey: "standard",
  });

  // 2. One line item per workflow pack — grants the pack's block + components.
  for (const p of packs) {
    const packEntitlement = `pack.${p.slug}` as EntitlementId;
    // Derive membership through the canonical granting function (no duplication).
    const granted = proRegistryItems().filter((item) => entitlementsThatGrant(item).includes(packEntitlement));
    rows.push({
      checkoutItemId: `pack.${p.slug}`,
      kind: "pack",
      entitlementId: packEntitlement,
      name: p.name,
      licenseType: "personal",
      seatAllowance: 1,
      registryItemsGranted: granted,
      updatePolicyKey: "standard",
    });
  }

  // 3. Individual Pro components — grant only that component. (Whether these are
  //    SOLD is a launch flag in checkout.ts; the mapping still exists so refunds
  //    and portal display resolve for any historical individual purchase.)
  for (const c of catalog) {
    if (c.access !== "pro") continue;
    if ((c.kind ?? "component") !== "component") continue;
    rows.push({
      checkoutItemId: `component.${c.registryItem}`,
      kind: "component",
      entitlementId: `component.${c.registryItem}` as EntitlementId,
      name: c.name,
      licenseType: "personal",
      seatAllowance: 1,
      registryItemsGranted: [c.registryItem],
      updatePolicyKey: "standard",
    });
  }

  return rows;
}

let _table: CheckoutItemDefinition[] | null = null;
function table(): CheckoutItemDefinition[] {
  if (!_table) _table = buildTable();
  return _table;
}

/** Every defined checkout item (catalog + packs + individual Pro components). */
export function checkoutItems(): CheckoutItemDefinition[] {
  return table();
}

/** Resolve an internal checkout item id → its definition, or null if unknown.
 *  Callers MUST treat null as "reject" (never checkout an unknown item). */
export function resolveCheckoutItem(id: string): CheckoutItemDefinition | null {
  return table().find((r) => r.checkoutItemId === id) ?? null;
}

// ---------------------------------------------------------------------------
// Provider product mapping. EMPTY until a real provider is approved. The map is
// read from config/env (JSON: { "<providerProductId>": "<internal checkoutItemId>" })
// so no provider product ids are baked into source. Fails closed: an unmapped or
// unparseable value yields null, and a null result must never grant anything.
// ---------------------------------------------------------------------------
export function providerProductMap(): Record<string, string> {
  const raw = process.env.MOTIONSTACK_PROVIDER_PRODUCT_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch {
    // Fail closed: a malformed map grants nothing rather than mis-granting.
    return {};
  }
  return {};
}

/** Map a PROVIDER product id → the internal entitlement it grants, or null.
 *  Returns null (deny) until a provider is approved and its map is configured. */
export function providerProductToEntitlement(providerProductId: string): EntitlementId | null {
  const internalId = providerProductMap()[providerProductId];
  if (!internalId) return null;
  const def = resolveCheckoutItem(internalId);
  return def ? def.entitlementId : null;
}

/** Map a PROVIDER product id → the internal checkout item definition, or null. */
export function providerProductToCheckoutItem(providerProductId: string): CheckoutItemDefinition | null {
  const internalId = providerProductMap()[providerProductId];
  if (!internalId) return null;
  return resolveCheckoutItem(internalId);
}

// ---------------------------------------------------------------------------
// Validation — FAILS if any Pro registry item is unreachable (no checkout item
// grants it). While catalog.complete exists this cannot happen; the check exists
// so removing/renaming coverage is caught before launch, not after.
// ---------------------------------------------------------------------------
export interface ProductMappingValidation {
  ok: boolean;
  problems: string[]; // hard failures — block paid launch
  warnings: string[]; // advisory — reachable only via the complete catalog
}

export function validateProductMapping(): ProductMappingValidation {
  const problems: string[] = [];
  const warnings: string[] = [];
  const rows = table();

  for (const item of proRegistryItems()) {
    const covering = rows.filter((r) => r.registryItemsGranted.includes(item));
    if (covering.length === 0) {
      problems.push(`${item}: Pro registry item has NO reachable checkout item`);
      continue;
    }
    const onlyComplete = covering.every((r) => r.kind === "catalog");
    if (onlyComplete) {
      warnings.push(`${item}: reachable only via the complete catalog (no pack or individual line item)`);
    }
  }

  return { ok: problems.length === 0, problems, warnings };
}
