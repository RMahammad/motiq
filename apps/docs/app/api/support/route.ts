// Support-intake route.
//
// POST /api/support — accept a provider-neutral, whitelisted support ticket and
// hand it to the active support provider. In preview the provider is a durable
// file-backed DEV STORE (lib/server/support.ts) — nothing is sent to any
// external system.
//
// PRIVACY / SECURITY (defense in depth): this route re-sanitizes AND re-redacts
// the payload server-side, dropping any non-whitelisted key and scrubbing
// token-like sequences (mk_test_/mk_live_ keys, Bearer headers, JWTs, long
// hex/base64 blobs) from the error summary and pasted logs before storage. It
// NEVER logs the ticket body — only a coarse, non-identifying signal (category).
import { NextResponse } from "next/server";

import { supportProvider, sanitizeSupportRequest } from "../../../lib/server/support";

export const dynamic = "force-dynamic"; // intake is never statically cached

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body." }, { status: 400 });
  }

  // Whitelist + sanitize + redact server-side (authoritative, defense in depth).
  const clean = sanitizeSupportRequest(body);
  if (!clean) {
    return NextResponse.json(
      { status: "error", message: "A category and an error summary are required." },
      { status: 400 },
    );
  }

  const result = await supportProvider().submit(clean);

  // Log a redacted, non-sensitive signal ONLY — never the summary or logs body.
  // eslint-disable-next-line no-console
  console.debug(`[support:api] received ${clean.category}`, { about: clean.componentOrPack });

  if (result.status === "error") {
    return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
  }
  return NextResponse.json({ status: "success" }, { status: 200 });
}
