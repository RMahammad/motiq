"use client";

import * as React from "react";

import {
  SessionSecurityCenter,
  type Session,
} from "@/registry/security/session-security-center";

/**
 * Compact catalog adapter (docs/55). Renders the REAL SessionSecurityCenter in
 * one calm, trustworthy state — a populated list of four sessions (this device
 * preserved, one flagged for review) at a fixed "now" so the relative
 * timestamps are deterministic. Real revoke/confirmation wiring is kept, but
 * there is NO external demo control bar. Clearly fictional data (RFC-5737 IPs,
 * approximate locations).
 */

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const T0 = 1_800_000_000_000; // fixed "now" anchoring the timeline

function seed(): Session[] {
  return [
    {
      id: "s-current",
      device: "MacBook Pro",
      browser: "Chrome 128",
      os: "macOS 15",
      deviceKind: "laptop",
      location: "Lisbon, PT",
      ipSummary: "203.0.113.x",
      createdTime: T0 - 40 * DAY,
      lastActiveTime: T0 - 20_000,
      current: true,
      state: "current",
      trustLabel: "Trusted",
      authMethod: "Passkey",
    },
    {
      id: "s-phone",
      device: "Pixel 8",
      browser: "Chrome 128",
      os: "Android 15",
      deviceKind: "phone",
      location: "Lisbon, PT",
      ipSummary: "203.0.113.x",
      createdTime: T0 - 18 * DAY,
      lastActiveTime: T0 - 3 * HOUR,
      state: "active",
      authMethod: "Password + 2FA",
    },
    {
      id: "s-ipad",
      device: "iPad Air",
      browser: "Safari 18",
      os: "iPadOS 18",
      deviceKind: "tablet",
      location: "Porto, PT",
      ipSummary: "198.51.100.x",
      createdTime: T0 - 9 * DAY,
      lastActiveTime: T0 - 5 * DAY,
      state: "idle",
      authMethod: "Password",
    },
    {
      id: "s-unknown",
      device: "Windows PC",
      browser: "Edge 128",
      os: "Windows 11",
      deviceKind: "desktop",
      location: "Amsterdam, NL",
      ipSummary: "192.0.2.x",
      createdTime: T0 - 1 * DAY,
      lastActiveTime: T0 - 40 * MIN,
      state: "active",
      authMethod: "Password",
      risk: { label: "New location", level: "attention" },
    },
  ];
}

export function SessionSecurityCenterCatalogPreview() {
  const [sessions, setSessions] = React.useState<Session[]>(seed);

  const revoke = (session: Session) =>
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
  const revokeOthers = (others: Session[]) => {
    const ids = new Set(others.map((o) => o.id));
    setSessions((prev) => prev.filter((s) => !ids.has(s.id)));
  };

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <SessionSecurityCenter
        sessions={sessions}
        now={T0}
        label="Where you're signed in"
        description="Review the devices with access to your account. Your current session stays signed in."
        onRevoke={revoke}
        onRevokeAllOthers={revokeOthers}
        className="max-w-none"
      />
    </div>
  );
}

export default SessionSecurityCenterCatalogPreview;
