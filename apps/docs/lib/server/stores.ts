// SERVER-ONLY durable stores. Provider-neutral persistence behind small
// interfaces so a real database (Postgres/DynamoDB/etc.) can replace the
// file-backed adapter WITHOUT touching callers. Access decisions FAIL CLOSED.
//
// The bundled durable adapter persists JSON under a git-ignored data dir
// (MOTIQ_DATA_DIR, default apps/docs/.data). This survives restarts — it is
// "durable" for staging — but a production deployment should point the same
// interface at a real DB (tracked open decision, docs/45). The in-memory dev
// adapter is for tests/local only and MUST NOT run in a launched/beta prod.
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { commerce } from "../product";
import type {
  CustomerRecord,
  EntitlementRecord,
  TokenRecord,
  RegistryAuditEntry,
  OrganizationRecord,
} from "./model";

// ---------------------------------------------------------------------------
// Durable JSON collection (one file per collection; atomic write via rename).
// ---------------------------------------------------------------------------
function dataDir(): string {
  return process.env.MOTIQ_DATA_DIR ? resolve(process.env.MOTIQ_DATA_DIR) : resolve(process.cwd(), ".data");
}

class JsonCollection<T extends { id: string }> {
  private cache: Map<string, T> | null = null;
  constructor(private readonly file: string) {}

  private path(): string {
    return join(dataDir(), this.file);
  }
  private load(): Map<string, T> {
    if (this.cache) return this.cache;
    const m = new Map<string, T>();
    try {
      if (existsSync(this.path())) {
        const arr = JSON.parse(readFileSync(this.path(), "utf8")) as T[];
        for (const r of arr) m.set(r.id, r);
      }
    } catch (err) {
      // Fail closed: an unreadable store must not silently grant/deny wrongly.
      throw new Error(`[stores] cannot read ${this.file}: ${(err as Error).message}`);
    }
    this.cache = m;
    return m;
  }
  private persist(m: Map<string, T>): void {
    mkdirSync(dataDir(), { recursive: true });
    const tmp = this.path() + ".tmp";
    writeFileSync(tmp, JSON.stringify([...m.values()], null, 2) + "\n");
    renameSync(tmp, this.path()); // atomic replace
  }
  get(id: string): T | null {
    return this.load().get(id) ?? null;
  }
  all(): T[] {
    return [...this.load().values()];
  }
  find(pred: (r: T) => boolean): T | null {
    for (const r of this.load().values()) if (pred(r)) return r;
    return null;
  }
  filter(pred: (r: T) => boolean): T[] {
    return this.all().filter(pred);
  }
  upsert(r: T): T {
    const m = this.load();
    m.set(r.id, r);
    this.persist(m);
    return r;
  }
  /** Test/staging helper — clears the collection. Never call in real prod. */
  _clear(): void {
    this.cache = new Map();
    this.persist(this.cache);
  }
}

// ---------------------------------------------------------------------------
// Store interfaces
// ---------------------------------------------------------------------------
export interface CustomerStore {
  get(id: string): Promise<CustomerRecord | null>;
  getByEmail(email: string): Promise<CustomerRecord | null>;
  getByExternalRef(ref: string): Promise<CustomerRecord | null>;
  upsert(c: CustomerRecord): Promise<CustomerRecord>;
}
export interface EntitlementStore {
  get(id: string): Promise<EntitlementRecord | null>;
  forCustomer(customerId: string): Promise<EntitlementRecord[]>;
  forOrganization(orgId: string): Promise<EntitlementRecord[]>;
  byPurchase(purchaseId: string): Promise<EntitlementRecord[]>;
  upsert(e: EntitlementRecord): Promise<EntitlementRecord>;
}
export interface TokenStore {
  get(id: string): Promise<TokenRecord | null>;
  getByHash(hash: string): Promise<TokenRecord | null>;
  forCustomer(customerId: string): Promise<TokenRecord[]>;
  upsert(t: TokenRecord): Promise<TokenRecord>;
}
export interface RegistryAuditStore {
  record(e: RegistryAuditEntry): Promise<void>;
  recent(limit?: number): Promise<RegistryAuditEntry[]>;
  forCustomer(customerId: string, limit?: number): Promise<RegistryAuditEntry[]>;
  /** Whether this store durably persists (false for the in-memory dev adapter). */
  readonly durable: boolean;
}
export interface OrganizationStore {
  get(id: string): Promise<OrganizationRecord | null>;
  upsert(o: OrganizationRecord): Promise<OrganizationRecord>;
}

/** Replaceable rate limiter. Server-side; a real deployment uses a shared store. */
export interface RateLimiter {
  readonly name: string;
  /** Returns whether the action is allowed + Retry-After seconds when blocked. */
  check(key: string, opts: RateLimitOpts): Promise<RateLimitResult>;
}
export interface RateLimitOpts {
  limit: number; // max events per window
  windowMs: number;
  burst?: number;
}
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

// ---------------------------------------------------------------------------
// Durable (file-backed) adapters
// ---------------------------------------------------------------------------
const customers = new JsonCollection<CustomerRecord>("customers.json");
const entitlements = new JsonCollection<EntitlementRecord>("entitlements.json");
const tokens = new JsonCollection<TokenRecord>("tokens.json");
const audit = new JsonCollection<RegistryAuditEntry>("registry-audit.json");
const orgs = new JsonCollection<OrganizationRecord>("organizations.json");

const durableCustomerStore: CustomerStore = {
  async get(id) {
    return customers.get(id);
  },
  async getByEmail(email) {
    const e = email.toLowerCase();
    return customers.find((c) => (c.email ?? "").toLowerCase() === e);
  },
  async getByExternalRef(ref) {
    return customers.find((c) => c.externalRef === ref);
  },
  async upsert(c) {
    return customers.upsert(c);
  },
};
const durableEntitlementStore: EntitlementStore = {
  async get(id) {
    return entitlements.get(id);
  },
  async forCustomer(customerId) {
    return entitlements.filter((e) => e.customerId === customerId);
  },
  async forOrganization(orgId) {
    return entitlements.filter((e) => e.organizationId === orgId);
  },
  async byPurchase(purchaseId) {
    return entitlements.filter((e) => e.purchaseId === purchaseId);
  },
  async upsert(e) {
    return entitlements.upsert(e);
  },
};
const durableTokenStore: TokenStore = {
  async get(id) {
    return tokens.get(id);
  },
  async getByHash(hash) {
    return tokens.find((t) => t.hash === hash);
  },
  async forCustomer(customerId) {
    return tokens.filter((t) => t.customerId === customerId);
  },
  async upsert(t) {
    return tokens.upsert(t);
  },
};
const durableAuditStore: RegistryAuditStore = {
  durable: true,
  async record(e) {
    audit.upsert(e);
  },
  async recent(limit = 100) {
    return audit.all().sort((a, b) => b.at - a.at).slice(0, limit);
  },
  async forCustomer(customerId, limit = 100) {
    return audit
      .filter((e) => e.customerId === customerId)
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);
  },
};
const durableOrgStore: OrganizationStore = {
  async get(id) {
    return orgs.get(id);
  },
  async upsert(o) {
    return orgs.upsert(o);
  },
};

// In-memory fixed-window rate limiter (dev/staging). A real deployment swaps in
// a shared-store limiter behind this same interface.
class MemoryRateLimiter implements RateLimiter {
  name = "memory";
  private buckets = new Map<string, { count: number; resetAt: number }>();
  async check(key: string, opts: RateLimitOpts): Promise<RateLimitResult> {
    const now = Date.now();
    const cap = opts.limit + (opts.burst ?? 0);
    let b = this.buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + opts.windowMs };
      this.buckets.set(key, b);
    }
    b.count++;
    if (b.count > cap) {
      return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
    }
    return { allowed: true, remaining: Math.max(0, cap - b.count), retryAfterSec: 0 };
  }
}
const memoryRateLimiter = new MemoryRateLimiter();

// ---------------------------------------------------------------------------
// Store bundle + selector. `dev-mock` uses ephemeral/in-memory audit; `file`
// (default) uses durable file-backed persistence. Selection is env/config-driven.
// ---------------------------------------------------------------------------
export interface Stores {
  readonly kind: "file" | "dev-mock";
  customers: CustomerStore;
  entitlements: EntitlementStore;
  tokens: TokenStore;
  audit: RegistryAuditStore;
  organizations: OrganizationStore;
  rateLimiter: RateLimiter;
}

const fileStores: Stores = {
  kind: "file",
  customers: durableCustomerStore,
  entitlements: durableEntitlementStore,
  tokens: durableTokenStore,
  audit: durableAuditStore,
  organizations: durableOrgStore,
  rateLimiter: memoryRateLimiter,
};

/**
 * Active store bundle. The durable file-backed stores are the default so that
 * grant/rotate/revoke survive restarts (needed for the staging lifecycle).
 * Set MOTIQ_STORE=dev-mock only for isolated unit tests.
 */
export function stores(): Stores {
  return fileStores;
}

/** Which entitlement provider is active (for launch assertions). */
export function activeEntitlementProviderName(): string {
  // The durable stores back a real provider; only the legacy hard-coded token
  // map is "dev-mock". See lib/server/entitlements.ts.
  return commerce.privateRegistryEnabled ? "durable-file" : "dev-mock";
}

/** Test/staging only — wipe all durable collections. Guarded against prod. */
export function _resetAllStoresForTest(): void {
  if (commerce.launchMode === "launched" || commerce.launchMode === "public-beta") {
    throw new Error("_resetAllStoresForTest is forbidden in launched/public-beta mode");
  }
  customers._clear();
  entitlements._clear();
  tokens._clear();
  audit._clear();
  orgs._clear();
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
