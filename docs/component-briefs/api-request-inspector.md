# Brief — API Request Inspector

- **Problem:** dev/observability UIs need a reusable request/response inspection surface for app-provided data — not a full API client.
- **Use case:** API dashboards, webhook inspection, dev consoles, debug tools, request history, observability.
- **Request data:** method, url, status, duration, timestamp, request/response headers, query params, request/response body, error, requestId, environment, retryCount, optional timing phases, optional auth summary. Never auto-reveal secrets; app can `redact` values.
- **Main states:** idle · loading · success · client_error · server_error · timeout · cancelled · retrying (use `getStatusMeta`/`statusVars`).
- **Main interaction:** expand sections (`useDisclosure`), copy url/request/response (`useCopy`), retry/cancel callbacks, search within payload, toggle wrapped lines, formatted vs raw view, collapse/redact sensitive sections. Payload text stays selectable.
- **Animation purpose:** state changes, section expansion, retry transition, response arrival, timing-phase reveal. No fake terminal typing.
- **API sketch:** `request`, `response?`, `state`, `onRetry?`, `onCancel?`, `onCopy?`, `redact?`, `defaultSection?`, `wrap?`, `onWrapChange?`, `renderBody?`, `formatTimestamp?`.
- **Accessibility:** status in text; keyboard-accessible sections; copy-success announcement; selectable payload; horizontal scroll for long lines; reduced-motion; redacted values clearly identified; no secrets in demo.
- **Mobile:** method/endpoint/status stack; tabs become a scrollable segmented control; payloads scroll horizontally.
- **Dependencies:** motion + `@motionkit/utils` + `@motionkit/primitives`. No new deps.
- **Similarity concern:** must not imitate a specific commercial API client; differentiate via redaction + phases + compare. Low–moderate.
- **Tier:** Pro.
- **Release criteria:** rapid gate + redaction verified + no secret-like demo values.
