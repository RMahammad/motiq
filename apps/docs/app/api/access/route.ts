// Access-request (waitlist) intake route.
//
// POST /api/access  — accept a provider-neutral access request and hand it to the
// active waitlist provider. In preview the provider is a DEV MOCK (in-memory), so
// nothing is stored in any external system.
//
// PRIVACY: this route never logs full personal data. Only coarse, non-identifying
// signals (result status) may be logged. The token/entitlement layer is elsewhere;
// this endpoint collects intent only and holds no secrets.
import { NextResponse } from "next/server";

import { commerce } from "../../../lib/product";
import {
  waitlistProvider,
  type WaitlistPack,
  type WaitlistRequest,
  type WaitlistTeamSize,
} from "../../../lib/server/waitlist";

export const dynamic = "force-dynamic"; // intake is never statically cached

const PACKS: WaitlistPack[] = ["ai-interface", "developer-tools", "collaboration", "data-motion", "complete"];
const TEAM_SIZES: WaitlistTeamSize[] = ["solo", "2-10", "11-50", "50+"];

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asPack(value: unknown): WaitlistPack | undefined {
  return typeof value === "string" && (PACKS as string[]).includes(value) ? (value as WaitlistPack) : undefined;
}

function asTeamSize(value: unknown): WaitlistTeamSize | undefined {
  return typeof value === "string" && (TEAM_SIZES as string[]).includes(value)
    ? (value as WaitlistTeamSize)
    : undefined;
}

/** Consent is required only when commerce policy demands it. Today: whenever a
 *  privacy policy URL is configured (a proxy for "we ask people to agree"). */
function consentRequired(): boolean {
  return Boolean(commerce.privacyUrl);
}

export async function POST(req: Request) {
  if (!commerce.waitlistEnabled) {
    return NextResponse.json(
      { status: "error", message: "Access requests are not open yet." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body." }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;

  const email = asString(data.email)?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ status: "error", message: "Email is required." }, { status: 400 });
  }

  const consent = data.consent === true;
  if (consentRequired() && !consent) {
    return NextResponse.json(
      { status: "error", message: "Please agree to the privacy terms to continue." },
      { status: 400 },
    );
  }

  const request: WaitlistRequest = {
    email,
    name: asString(data.name),
    intendedUse: asString(data.intendedUse),
    interestedPack: asPack(data.interestedPack),
    teamSize: asTeamSize(data.teamSize),
    message: asString(data.message),
    consent,
  };

  let result;
  try {
    result = await waitlistProvider().submit(request);
  } catch (err) {
    // Never surface provider internals or personal data.
    const message = err instanceof Error ? err.message : "Access requests are temporarily unavailable.";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }

  if (result.status === "error") {
    return NextResponse.json(result, { status: 400 });
  }

  // success | duplicate → 200 (duplicate is a normal, non-error outcome).
  return NextResponse.json(result, { status: 200 });
}
