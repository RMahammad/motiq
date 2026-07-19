"use client";

import * as React from "react";

import {
  ApiRequestInspector,
  type ApiRequest,
  type ApiResponse,
  type AuthSummary,
} from "@/registry/developer-tools/api-request-inspector";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ApiRequestInspector in
 * one representative success state — a completed POST with the response body
 * open — with trimmed headers/timing and no endpoint switcher or
 * Send/Retry/Redaction controls. Credential headers are pre-masked placeholders.
 * The detail page keeps the full console rig.
 */

const BASE_TS = 1_700_000_000_000;

const REQUEST: ApiRequest = {
  method: "POST",
  url: "https://api.demo.dev/v1/deployments",
  environment: "production",
  requestId: "req_9fa2c1e7b0",
  timestamp: BASE_TS,
  query: { wait: "true", region: "iad1" },
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer ••••••",
    "X-Api-Key": "••••••",
  },
  body: {
    project: "ledger-web",
    ref: "main",
    target: "production",
  },
};

const RESPONSE: ApiResponse = {
  status: 201,
  statusText: "Created",
  durationMs: 812,
  retryCount: 0,
  headers: {
    "Content-Type": "application/json",
    "X-Request-Id": "req_9fa2c1e7b0",
    "X-Ratelimit-Remaining": "4998",
  },
  body: {
    id: "dpl_7Kq2",
    state: "queued",
    url: "https://ledger-web-7kq2.demo.app",
    createdAt: "2024-11-14T22:13:20Z",
  },
  phases: [
    { label: "DNS", durationMs: 24 },
    { label: "TLS", durationMs: 88 },
    { label: "TTFB", durationMs: 502 },
    { label: "Download", durationMs: 157 },
  ],
};

const AUTH: AuthSummary = {
  scheme: "Bearer",
  principal: "svc_deploy_bot",
  scopes: ["deployments:write", "projects:read"],
  note: "Service token · rotates every 24h",
};

export function ApiRequestInspectorCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ApiRequestInspector
        request={REQUEST}
        response={RESPONSE}
        state="success"
        auth={AUTH}
        title="Console · production"
      />
    </div>
  );
}

export default ApiRequestInspectorCatalogPreview;
