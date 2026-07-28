# Security policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.** A public report tells
everyone about the weakness before there is a fix.

Report it privately instead, either way:

- **GitHub** — use *Security → Report a vulnerability* on the repository. This opens a
  private advisory that only maintainers can see.
- **Email** — `legal@motiq.dev`.

Please include what you found, how to reproduce it, which component or route is affected,
and what an attacker could do with it. A minimal reproduction helps more than anything else.

## What to expect

Motiq is maintained independently, so response times are best-effort rather than
guaranteed:

- We aim to acknowledge a report within a few days.
- We will tell you whether we consider it a vulnerability, and why.
- If it is one, we will work on a fix and credit you in the release notes unless you
  prefer otherwise.

Please give us a reasonable opportunity to publish a fix before disclosing publicly.

## Scope

Motiq ships **source code that is copied into your project**. There is no hosted runtime,
no authentication, no user accounts, and no customer data — so the realistic attack surface
is narrower than for a typical service.

**In scope**

- A vulnerability in shipped component source (for example an XSS vector in a component
  that renders user-supplied content).
- A vulnerability in the documentation site or the public registry endpoints at
  `motiq.dev`.
- A supply-chain problem in this repository — a compromised dependency, a build script
  that does something it should not, or a registry item serving unexpected content.

**Out of scope**

- Vulnerabilities in third-party dependencies. Report those to their maintainers; tell us
  if a Motiq component is affected so we can bump or work around it.
- Vulnerabilities in your own application built with Motiq components.
- Issues in the hosting or CDN providers themselves.
- Missing security headers or best-practice suggestions with no demonstrated impact.
- Automated scanner output without a working proof of concept.

## Supported versions

The catalog is pre-1.0 and fixes land on the latest release. There is no long-term
support branch and no backporting to earlier versions.

## Handling secrets

Never include an API key, access token, password, or other credential in a report,
an issue, or a pull request. If you believe you have exposed one through this project,
rotate it immediately and let us know.
