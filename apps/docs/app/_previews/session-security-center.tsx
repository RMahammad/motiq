"use client";

import * as React from "react";

import {
  SessionSecurityCenter,
  type Session,
} from "@/registry/security/session-security-center";

/* Clearly fictional demo — the "account security" screen of an imaginary app.
 * No real people, devices, IPs, or locations. The IPs are RFC-5737 documentation
 * ranges shown already-summarised, and locations are labelled approximate. Fixed
 * ids + timestamps anchor the timeline so there is no SSR/CSR hydration drift;
 * live ids are only minted inside handlers. This preview stands in for the host
 * app: it owns the session data and performs the (simulated) revocations, while
 * the component owns confirmation, focus, and the destructive-action safeguards. */

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const T0 = 1_800_000_000_000; // fixed "now" anchoring the demo timeline

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
      organization: "Northwind Studio",
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
      organization: "Northwind Studio",
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

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function SessionSecurityCenterPreview() {
  const [sessions, setSessions] = React.useState<Session[]>(seed);
  const [error, setError] = React.useState<string | null>(null);
  const [failNext, setFailNext] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const idRef = React.useRef(0);
  const lastFailed = React.useRef<{ kind: "one"; session: Session } | { kind: "others"; others: Session[] } | null>(null);

  const nextId = () => {
    idRef.current += 1;
    return `demo-${idRef.current}`;
  };

  // The "selected" session the demo shims act on: the first non-current one.
  const selected = sessions.find((s) => !s.current);

  const removeAfter = (ids: Set<string>) => {
    setSessions((prev) => prev.map((s) => (ids.has(s.id) ? { ...s, state: "pending-revocation" } : s)));
    window.setTimeout(() => {
      setSessions((prev) => prev.filter((s) => !ids.has(s.id)));
    }, 620);
  };

  // Passed to the component: fires only after the user confirms in the dialog.
  const revoke = (session: Session) => {
    if (failNext) {
      setFailNext(false);
      lastFailed.current = { kind: "one", session };
      setError(`Couldn't revoke the session on ${session.device}. It is still signed in - please try again.`);
      return;
    }
    setError(null);
    lastFailed.current = null;
    removeAfter(new Set([session.id]));
  };

  const revokeOthers = (others: Session[]) => {
    if (failNext) {
      setFailNext(false);
      lastFailed.current = { kind: "others", others };
      setError("Couldn't revoke the other sessions. They are still signed in - please try again.");
      return;
    }
    setError(null);
    lastFailed.current = null;
    removeAfter(new Set(others.map((o) => o.id)));
  };

  const rename = (session: Session, name: string) =>
    setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, device: name } : s)));

  const markTrusted = (session: Session) =>
    setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, trustLabel: "Trusted" } : s)));
  const removeTrust = (session: Session) =>
    setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, trustLabel: undefined } : s)));

  /* -- demo control shims -------------------------------------------------- */

  const addSession = () => {
    const n = nextId();
    setSessions((prev) => [
      ...prev,
      {
        id: n,
        device: "Linux Laptop",
        browser: "Firefox 130",
        os: "Ubuntu 24.04",
        deviceKind: "laptop",
        location: "Berlin, DE",
        ipSummary: "192.0.2.x",
        createdTime: T0 - 5 * MIN,
        lastActiveTime: T0 - 1 * MIN,
        state: "active",
        authMethod: "Password",
      },
    ]);
  };

  const markIdle = () => {
    if (!selected) return;
    setSessions((prev) => prev.map((s) => (s.id === selected.id ? { ...s, state: "idle" } : s)));
  };

  const markRisk = () => {
    if (!selected) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selected.id ? { ...s, risk: { label: "Unrecognised device", level: "attention" } } : s,
      ),
    );
  };

  const revokeSelected = () => {
    if (!selected) return;
    revoke(selected);
  };

  const revokeAllOthersShim = () => {
    const others = sessions.filter((s) => !s.current && s.state !== "pending-revocation");
    if (others.length) revokeOthers(others);
  };

  const retry = () => {
    setError(null);
    const last = lastFailed.current;
    lastFailed.current = null;
    if (last?.kind === "one") revoke(last.session);
    else if (last?.kind === "others") revokeOthers(last.others);
  };

  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 700);
  };

  const reset = () => {
    setSessions(seed());
    setError(null);
    setFailNext(false);
    setRefreshing(false);
    lastFailed.current = null;
    idRef.current = 0;
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-4">
      {/* account-security workspace shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Account · Security &amp; sessions
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Signed in as you@northwind.example</span>
        </div>

        <div className="p-3">
          <SessionSecurityCenter
            sessions={sessions}
            now={T0}
            label="Where you're signed in"
            description="Review the devices with access to your account. Revoke anything you don't recognise - your current session stays signed in."
            error={error}
            refreshing={refreshing}
            onRevoke={revoke}
            onRevokeAllOthers={revokeOthers}
            onRenameDevice={rename}
            onMarkTrusted={markTrusted}
            onRemoveTrust={removeTrust}
            onInspect={() => {}}
            onRefresh={refresh}
            onRetry={retry}
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addSession}>
          Add session
        </button>
        <button type="button" className={control} onClick={markIdle} disabled={!selected}>
          Mark idle
        </button>
        <button type="button" className={control} onClick={markRisk} disabled={!selected}>
          Mark supplied risk
        </button>
        <button type="button" className={control} onClick={revokeSelected} disabled={!selected}>
          Revoke selected
        </button>
        <button type="button" className={control} onClick={revokeAllOthersShim}>
          Revoke all others
        </button>
        <button type="button" className={control} aria-pressed={failNext} onClick={() => setFailNext((f) => !f)}>
          {failNext ? "Fail revocation: on" : "Fail revocation: off"}
        </button>
        <button type="button" className={control} onClick={retry}>
          Retry
        </button>
        <button type="button" className={control} onClick={refresh}>
          Refresh
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">
          Current session is always preserved
        </span>
      </div>
    </div>
  );
}

export default SessionSecurityCenterPreview;
