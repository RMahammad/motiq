"use client";

import * as React from "react";

import {
  ApiRequestInspector,
  type ApiRequest,
  type ApiResponse,
  type InspectorState,
} from "@/registry/developer-tools/api-request-inspector";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a "Developer Request Console". Every endpoint, header, id and
 * timing below is fictional and local; there is NO real API here. The
 * component only renders whatever request/response/state the console passes it.
 * There are deliberately NO real secrets: credential headers are pre-masked
 * placeholders (e.g. "Bearer ••••••") and the inspector redacts them anyway.
 * ---------------------------------------------------------------------- */

// Fixed base timestamp so the server-rendered initial state is deterministic.
// Post-mount handlers advance from this same baseline — never wall-clock now().
const BASE_TS = 1_700_000_000_000;

type ScenarioId = "deploy" | "project" | "webhook";

interface Scenario {
  id: ScenarioId;
  label: string;
  request: ApiRequest;
  success: ApiResponse;
  clientError: ApiResponse;
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  deploy: {
    id: "deploy",
    label: "POST /v1/deployments",
    request: {
      method: "POST",
      url: "https://api.demo.dev/v1/deployments",
      environment: "production",
      requestId: "req_9fa2c1e7b0",
      timestamp: BASE_TS,
      query: { wait: "true", region: "iad1" },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer ••••••",
        "X-Api-Key": "••••••",
        "User-Agent": "demo-console/1.4",
      },
      body: {
        project: "ledger-web",
        ref: "main",
        target: "production",
        env: { NODE_ENV: "production", FLAGS: "edge,streaming" },
      },
    },
    success: {
      status: 201,
      statusText: "Created",
      durationMs: 812,
      retryCount: 0,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": "req_9fa2c1e7b0",
        "X-Ratelimit-Remaining": "4998",
        "Set-Cookie": "session=••••••; HttpOnly",
      },
      body: {
        id: "dpl_7Kq2",
        state: "queued",
        url: "https://ledger-web-7kq2.demo.app",
        createdAt: "2024-11-14T22:13:20Z",
      },
      phases: [
        { label: "DNS", durationMs: 24 },
        { label: "TCP", durationMs: 41 },
        { label: "TLS", durationMs: 88 },
        { label: "TTFB", durationMs: 502 },
        { label: "Download", durationMs: 157 },
      ],
    },
    clientError: {
      status: 422,
      statusText: "Unprocessable",
      durationMs: 143,
      retryCount: 0,
      error: "Deployment rejected: `ref` \"main\" has no successful build. Push a commit or select another ref.",
      headers: { "Content-Type": "application/json", "X-Request-Id": "req_9fa2c1e7b0" },
      body: { error: { code: "invalid_ref", field: "ref", message: "No build found for ref 'main'." } },
    },
  },
  project: {
    id: "project",
    label: "GET /v1/projects/demo",
    request: {
      method: "GET",
      url: "https://api.demo.dev/v1/projects/demo",
      environment: "production",
      requestId: "req_3c17de0aa9",
      timestamp: BASE_TS + 4000,
      query: { include: "members,domains" },
      headers: {
        Accept: "application/json",
        Authorization: "Bearer ••••••",
        "If-None-Match": '"a91f0c2"',
      },
    },
    success: {
      status: 200,
      statusText: "OK",
      durationMs: 196,
      retryCount: 0,
      headers: {
        "Content-Type": "application/json",
        Etag: '"a91f0c2"',
        "Cache-Control": "private, max-age=30",
      },
      body: {
        id: "prj_demo",
        name: "Ledger Web",
        framework: "next",
        members: 4,
        domains: ["ledger.demo.app", "www.ledger.demo.app"],
      },
      phases: [
        { label: "DNS", durationMs: 8 },
        { label: "TLS", durationMs: 61 },
        { label: "TTFB", durationMs: 104 },
        { label: "Download", durationMs: 23 },
      ],
    },
    clientError: {
      status: 404,
      statusText: "Not Found",
      durationMs: 88,
      retryCount: 0,
      error: "Project 'demo' not found, or your token lacks access to it.",
      headers: { "Content-Type": "application/json", "X-Request-Id": "req_3c17de0aa9" },
      body: { error: { code: "not_found", message: "No project matches that id." } },
    },
  },
  webhook: {
    id: "webhook",
    label: "POST /v1/webhooks/test",
    request: {
      method: "POST",
      url: "https://api.demo.dev/v1/webhooks/test",
      environment: "staging",
      requestId: "req_bb84f0217c",
      timestamp: BASE_TS + 8000,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer ••••••",
        "X-Webhook-Signature": "••••••",
      },
      body: { event: "deployment.succeeded", deliveryId: "dlv_5m2", payload: { deploymentId: "dpl_7Kq2" } },
    },
    success: {
      status: 200,
      statusText: "OK",
      durationMs: 327,
      retryCount: 1,
      headers: { "Content-Type": "application/json", "X-Request-Id": "req_bb84f0217c" },
      body: { delivered: true, endpoint: "https://hooks.demo.app/in", attempts: 2 },
      phases: [
        { label: "DNS", durationMs: 12 },
        { label: "TLS", durationMs: 74 },
        { label: "TTFB", durationMs: 198 },
        { label: "Download", durationMs: 43 },
      ],
    },
    clientError: {
      status: 400,
      statusText: "Bad Request",
      durationMs: 61,
      retryCount: 0,
      error: "Webhook payload failed validation: `event` is not a recognised event type.",
      headers: { "Content-Type": "application/json", "X-Request-Id": "req_bb84f0217c" },
      body: { error: { code: "invalid_event", message: "Unknown event 'deployment.succeeded.v2'." } },
    },
  },
};

const AUTH = {
  scheme: "Bearer",
  principal: "svc_deploy_bot",
  scopes: ["deployments:write", "projects:read", "webhooks:test"],
  note: "Service token · rotates every 24h",
};

const controlBtn =
  "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]";

const tab =
  "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors data-[on=true]:bg-[var(--color-surface)] data-[on=true]:text-[var(--color-fg)] data-[on=true]:shadow-[var(--shadow-sm)] text-[var(--color-muted)] hover:text-[var(--color-fg)]";

export function ApiRequestInspectorPreview() {
  const [scenarioId, setScenarioId] = React.useState<ScenarioId>("deploy");
  const [state, setState] = React.useState<InspectorState>("success");
  const [response, setResponse] = React.useState<ApiResponse | undefined>(SCENARIOS.deploy.success);
  const [wrap, setWrap] = React.useState(false);
  const [redactOn, setRedactOn] = React.useState(true);
  const [copies, setCopies] = React.useState(0);
  const loadingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS[scenarioId];

  React.useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
  }, []);

  const selectScenario = React.useCallback((id: ScenarioId) => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setScenarioId(id);
    setState("success");
    setResponse(SCENARIOS[id].success);
  }, []);

  const send = React.useCallback(() => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setState("loading");
    setResponse(undefined);
    loadingTimer.current = setTimeout(() => {
      setState("success");
      setResponse(SCENARIOS[scenarioId].success);
    }, 900);
  }, [scenarioId]);

  const returnSuccess = React.useCallback(() => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setState("success");
    setResponse(scenario.success);
  }, [scenario]);

  const returnClientError = React.useCallback(() => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setState("client_error");
    setResponse(scenario.clientError);
  }, [scenario]);

  const returnTimeout = React.useCallback(() => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setState("timeout");
    setResponse({
      durationMs: 30000,
      retryCount: 0,
      error: "Request exceeded the 30s timeout with no response from the origin.",
    });
  }, []);

  const retry = React.useCallback(() => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setState("retrying");
    setResponse(undefined);
    loadingTimer.current = setTimeout(() => {
      setState("success");
      setResponse({ ...SCENARIOS[scenarioId].success, retryCount: 1 });
    }, 900);
  }, [scenarioId]);

  const cancel = React.useCallback(() => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setState("cancelled");
    setResponse(undefined);
  }, []);

  return (
    <div className="w-full max-w-[820px]">
      {/* Console chrome ---------------------------------------------------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-semibold text-[var(--color-fg)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Developer Request Console
        </span>
        <span className="text-[11.5px] text-[var(--color-muted)]">Fictional demo data · no live API</span>
        {copies > 0 ? (
          <span className="ml-auto text-[11.5px] tabular-nums text-[var(--color-muted)]">{copies} copied</span>
        ) : null}
      </div>

      {/* Endpoint switcher ------------------------------------------------- */}
      <div className="mb-3 flex flex-wrap items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1" role="group" aria-label="Endpoint">
        {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
          <button
            key={id}
            type="button"
            data-on={scenarioId === id}
            aria-pressed={scenarioId === id}
            className={tab}
            onClick={() => selectScenario(id)}
          >
            {SCENARIOS[id].label}
          </button>
        ))}
      </div>

      <ApiRequestInspector
        request={scenario.request}
        response={response}
        state={state}
        auth={AUTH}
        wrap={wrap}
        onWrapChange={setWrap}
        redact={redactOn}
        onRetry={retry}
        onCancel={cancel}
        onCopy={() => setCopies((c) => c + 1)}
        title={`Console · ${scenario.request.environment}`}
      />

      {/* Working controls -------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Console controls">
        <button type="button" className={controlBtn} onClick={send}>Send request</button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button type="button" className={controlBtn} onClick={returnSuccess}>Return success</button>
        <button type="button" className={controlBtn} onClick={returnClientError}>Return client error</button>
        <button type="button" className={controlBtn} onClick={returnTimeout}>Return timeout</button>
        <button type="button" className={controlBtn} onClick={retry}>Retry</button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button type="button" className={controlBtn} onClick={() => setWrap((w) => !w)} aria-pressed={wrap}>
          {wrap ? "Wrapping: on" : "Wrapping: off"}
        </button>
        <button type="button" className={controlBtn} onClick={() => setRedactOn((r) => !r)} aria-pressed={redactOn}>
          {redactOn ? "Redaction: on" : "Redaction: off"}
        </button>
      </div>
    </div>
  );
}

export default ApiRequestInspectorPreview;
