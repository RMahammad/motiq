// Provider-neutral protected-artifact DOWNLOAD route (fallback delivery).
//
// GET /api/download?sig=<signed-download-token>
//   - The `sig` param is the SHORT-LIVED, HMAC-signed download capability minted
//     by lib/server/download.ts. A query param is acceptable here ONLY because it
//     is a single-use-shaped, expiring, signed capability — NOT a license key and
//     NOT a permanent URL.
//   - Defense in depth: the customer's registry token is still required in the
//     Authorization: Bearer header and re-checked through the fail-closed
//     resolver, so a leaked (still-valid) capability alone cannot deliver source.
//
// Responses:
//   200 → artifact JSON manifest (files + checksum + version)
//   403 → bad/absent capability, entitlement denied, or customer mismatch
//   410 → capability expired
//   404 → unknown/unreadable item
//
// No public static Pro ZIP. No permanent URL. Never statically cached.
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { verifySignedDownload, buildArtifact } from "../../../lib/server/download";
import { resolveAccess } from "../../../lib/server/access";
import { stores } from "../../../lib/server/stores";
import type { RegistryAuditEntry, AuditResult } from "../../../lib/server/model";

export const dynamic = "force-dynamic"; // gated + time-sensitive; never cache

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/** Record a download-delivery audit entry. Never blocks the response. */
async function audit(
  item: string,
  result: AuditResult,
  httpStatus: number,
  customerId: string | null,
  failureReason: string | null,
  req: Request,
): Promise<void> {
  const entry: RegistryAuditEntry = {
    id: `aud_dl_${createHash("sha256").update(item + ":" + Date.now()).digest("hex").slice(0, 16)}`,
    at: Date.now(),
    customerId,
    organizationId: null,
    tokenId: null,
    item,
    entitlementUsed: null,
    result,
    httpStatus,
    dependencyItems: [],
    userAgent: req.headers.get("user-agent"),
    ipHash: null,
    durationMs: 0,
    failureReason,
  };
  try {
    await stores().audit.record(entry);
  } catch {
    /* audit must never block delivery */
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sig = url.searchParams.get("sig");

  // ---- verify the signed, short-lived capability ----------------------------
  const verified = verifySignedDownload(sig);
  if (!verified.ok) {
    if (verified.expired && verified.itemName) {
      await audit(verified.itemName, "expired-token", 410, verified.customerId, "download-capability-expired", req);
      return NextResponse.json(
        { error: "expired", message: "This download link has expired. Request a fresh one." },
        { status: 410 },
      );
    }
    return NextResponse.json(
      { error: "invalid", message: "Invalid or missing download capability." },
      { status: 403 },
    );
  }

  const itemName = verified.itemName as string;
  const signedCustomerId = verified.customerId as string;

  // ---- defense in depth: re-check entitlement with the customer's token -----
  const token = bearer(req);
  const ip = clientIp(req);
  const decision = await resolveAccess(itemName, token, { userAgent: req.headers.get("user-agent"), ip });

  if (!decision.granted) {
    // resolveAccess already audited the access check; return its status (no body source).
    return NextResponse.json(
      {
        error: decision.result,
        item: itemName,
        message:
          decision.result === "missing-token"
            ? "Send Authorization: Bearer <token> to download this item."
            : "Access to this item was denied.",
      },
      { status: decision.httpStatus },
    );
  }

  // The capability's customer must match the entitled token's customer.
  if (decision.customerId !== signedCustomerId) {
    await audit(itemName, "missing-entitlement", 403, decision.customerId, "capability-customer-mismatch", req);
    return NextResponse.json(
      { error: "forbidden", message: "This download capability does not match your account." },
      { status: 403 },
    );
  }

  // ---- assemble + deliver ---------------------------------------------------
  const artifact = buildArtifact(itemName);
  if (!artifact) {
    await audit(itemName, "unknown-item", 404, decision.customerId, "artifact-unavailable", req);
    return NextResponse.json({ error: "not_found", item: itemName }, { status: 404 });
  }

  await audit(itemName, "granted", 200, decision.customerId, "download", req);
  return NextResponse.json(
    {
      itemName: artifact.itemName,
      kind: artifact.kind,
      version: artifact.version,
      releaseDate: artifact.releaseDate,
      members: artifact.members,
      checksum: artifact.checksum,
      minDeps: artifact.minDeps ?? null,
      files: artifact.files.map((f) => ({ member: f.member, path: f.path, target: f.target, type: f.type, content: f.content })),
    },
    { status: 200 },
  );
}
