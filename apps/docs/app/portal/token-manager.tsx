"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { TokenMeta } from "../../lib/server/tokens";
import { CopyButton } from "../_components/code-block";
import { SelectControl } from "../_components/select-control";

// Client-side token management for the PREVIEW portal. Calls the gated
// /api/portal/tokens route. A freshly-created/rotated plaintext token is shown
// EXACTLY ONCE here in the browser — it is never stored and never returned by a
// listing, so the customer must copy it now. `tokens` (metadata only, no
// plaintext) is passed from the Server Component and refreshed via router.refresh().

type Environment = "test" | "live";

function fmtDate(ms: number | null): string {
  if (ms == null) return "—";
  return new Date(ms).toLocaleString();
}

export function TokenManager({
  customerId,
  tokens,
  tokenEnvVar = "MOTIQ_TOKEN",
}: {
  customerId: string;
  tokens: TokenMeta[];
  /** Env-var name the CLI reads the token from (derived from the brand upstream). */
  tokenEnvVar?: string;
}) {
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [environment, setEnvironment] = React.useState<Environment>("test");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // The one-time plaintext to reveal. Cleared as soon as the customer dismisses it.
  const [freshToken, setFreshToken] = React.useState<{ token: string; id: string } | null>(null);

  const post = React.useCallback(
    async (payload: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
      setError(null);
      const res = await fetch("/api/portal/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerId, ...payload }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
        return null;
      }
      return data;
    },
    [customerId],
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    const data = await post({ action: "create", label: label || undefined, environment });
    setBusy(null);
    if (data && typeof data.token === "string" && typeof data.tokenId === "string") {
      setFreshToken({ token: data.token, id: data.tokenId });
      setLabel("");
      router.refresh();
    }
  }

  async function onRotate(tokenId: string) {
    setBusy(tokenId);
    const data = await post({ action: "rotate", tokenId });
    setBusy(null);
    if (data && typeof data.token === "string" && typeof data.tokenId === "string") {
      setFreshToken({ token: data.token, id: data.tokenId });
      router.refresh();
    }
  }

  async function onRevoke(tokenId: string) {
    setBusy(tokenId);
    const data = await post({ action: "revoke", tokenId });
    setBusy(null);
    if (data) router.refresh();
  }

  const active = tokens.filter((t) => t.revokedAt == null);
  const revoked = tokens.filter((t) => t.revokedAt != null);

  return (
    <div className="flex flex-col gap-5">
      {/* One-time freshly-issued token — copy now, never shown again. */}
      {freshToken ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-bg-secondary)] p-4"
        >
          <p className="text-[13px] font-medium text-[var(--color-fg)]">Your new token — copy it now</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
            This is the only time this token is shown. It is not stored and cannot be retrieved again. Store it in your
            environment as <code className="font-mono text-[var(--color-fg)]">{tokenEnvVar}</code>.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2">
            <code className="overflow-x-auto whitespace-nowrap font-mono text-[13px] text-[var(--color-code-fg)]">
              {freshToken.token}
            </code>
            <CopyButton text={freshToken.token} label="Copy token" />
          </div>
          <button
            type="button"
            onClick={() => setFreshToken(null)}
            className="mt-3 inline-flex items-center rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[12px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            I’ve saved it — dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-[12.5px] text-[var(--color-error,#dc2626)]">
          Something went wrong: {error}
        </p>
      ) : null}

      {/* Create */}
      <form onSubmit={onCreate} className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="token-label" className="text-[12.5px] font-medium text-[var(--color-fg)]">
            Token label
          </label>
          <input
            id="token-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Local machine"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-fg)] outline-none focus-visible:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="token-env" className="text-[12.5px] font-medium text-[var(--color-fg)]">
            Environment
          </label>
          <SelectControl
            id="token-env"
            value={environment}
            onChange={(next) => setEnvironment(next as Environment)}
            options={[
              { value: "test", label: "Test" },
              { value: "live", label: "Live" },
            ]}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-fg)] outline-none focus-visible:border-[var(--color-accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={busy === "create"}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-[var(--color-accent-contrast,#fff)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy === "create" ? "Creating…" : "Create token"}
        </button>
      </form>

      {/* Existing tokens — metadata only (never the plaintext). */}
      {active.length === 0 && revoked.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted)]">No registry tokens yet. Create one above to install Pro source.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {[...active, ...revoked].map((t) => {
            const isRevoked = t.revokedAt != null;
            return (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium text-[var(--color-fg)]">{t.label}</span>
                    <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                      {t.environment}
                    </span>
                    {isRevoked ? (
                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
                        Revoked
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--color-fg)]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-mono text-[12px] text-[var(--color-muted)]">
                    {/* Only a short prefix is ever shown — never the full token. */}
                    {t.prefix}… · created {fmtDate(t.createdAt)} · last used {fmtDate(t.lastUsedAt)}
                    {isRevoked ? ` · revoked ${fmtDate(t.revokedAt)}` : ""}
                  </p>
                </div>
                {!isRevoked ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRotate(t.id)}
                      disabled={busy === t.id}
                      className="inline-flex items-center rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] disabled:opacity-60"
                    >
                      {busy === t.id ? "Working…" : "Rotate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRevoke(t.id)}
                      disabled={busy === t.id}
                      className="inline-flex items-center rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-error,#dc2626)] transition-colors hover:border-[var(--color-error,#dc2626)] disabled:opacity-60"
                    >
                      Revoke
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[12px] text-[var(--color-muted)]">
        Rotating issues a fresh token and immediately revokes the previous one. Revoked tokens stop working on the next
        registry request. Tokens are shown in full only at the moment of creation or rotation.
      </p>
    </div>
  );
}
