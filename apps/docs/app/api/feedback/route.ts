// Product feedback intake route.
//
// POST /api/feedback — accept a provider-neutral, whitelisted feedback payload
// and hand it to the active (dev-store) adapter. In preview the adapter is an
// in-memory DEV MOCK — nothing is stored externally.
//
// Accepts the base feedback fields PLUS the private-preview dimensions (docs/50):
// per-facet ratings (usefulness, visualQuality, apiClarity, installation,
// documentation, accessibility, performance), gap free-text (missingState,
// missingComponent, productionBlocker), and access-intent enums. All validation
// and sanitization is delegated to sanitizeFeedback — unknown keys are dropped.
//
// PRIVACY: this route re-sanitizes the payload server-side (defense in depth),
// dropping any non-whitelisted key and stripping control chars / query strings
// from every free-text field. It NEVER logs the free-text message or any
// personal content — only coarse, non-identifying signals (category).
import { NextResponse } from "next/server";

import { sanitizeFeedback, type FeedbackPayload } from "../../../lib/feedback";

export const dynamic = "force-dynamic"; // intake is never statically cached

// ---------------------------------------------------------------------------
// Server-side DEV MOCK store — in-memory, not durable, not external storage.
// Entries live only for the current server process. A real provider (docs/45)
// plugs in behind this same shape.
// ---------------------------------------------------------------------------
interface StoredFeedback extends FeedbackPayload {
  id: string;
  at: number;
}

const devFeedback: StoredFeedback[] = [];

function newId(): string {
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body." }, { status: 400 });
  }

  // Whitelist enforcement: only known, correctly-typed fields survive.
  const clean = sanitizeFeedback(body);
  if (!clean) {
    return NextResponse.json(
      { status: "error", message: "A category and a message are required." },
      { status: 400 },
    );
  }

  const record: StoredFeedback = { ...clean, id: newId(), at: Date.now() };
  devFeedback.push(record);
  if (devFeedback.length > 500) devFeedback.shift();

  // Log a redacted, non-sensitive signal ONLY — never the message body.
  // eslint-disable-next-line no-console
  console.debug(`[feedback:api] received ${clean.category}`, { about: clean.componentOrPack });

  return NextResponse.json({ status: "success" }, { status: 200 });
}
