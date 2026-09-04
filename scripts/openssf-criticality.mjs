#!/usr/bin/env node
/**
 * Measures this repository's OpenSSF criticality score.
 *
 * The score is NOT a property you can add to a repo — it is a computed function of ten
 * observed signals (age, activity, contributors, issue traffic, downstream mentions).
 * Adding files never moves it; adoption and sustained activity do. This script exists so
 * the number is measured rather than guessed, and so it is obvious WHICH signal is the
 * binding constraint at any moment.
 *
 * Algorithm mirrors ossf/criticality_score exactly (config/scorer/original_pike.yml plus
 * internal/scorer/algorithm): each signal is clamped into [lower, upper], inverted when
 * smaller_is_better, normalized as log(1+v)/log(1+threshold), then combined as a weighted
 * arithmetic mean. A signal that cannot be collected is DROPPED from both the numerator
 * and the denominator — same as upstream — so a partial run reports an optimistic score.
 * That is why every dropped signal is printed loudly.
 *
 * Usage:
 *   node scripts/openssf-criticality.mjs [owner/repo] [--json] [--mentions=N]
 *
 * A GITHUB_TOKEN (or GH_TOKEN) is strongly recommended: unauthenticated REST is 60
 * req/hour and the commit-search endpoint used for github_mention_count requires auth.
 */
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const mentionsOverride = args
  .find((a) => a.startsWith("--mentions="))
  ?.split("=")[1];
const slugArg = args.find((a) => !a.startsWith("--"));

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

/** Weights and bounds from config/scorer/original_pike.yml. */
const INPUTS = [
  { field: "created_since", weight: 1, upper: 120 },
  { field: "updated_since", weight: 1, upper: 120, smallerIsBetter: true },
  { field: "contributor_count", weight: 2, upper: 5000 },
  { field: "org_count", weight: 1, upper: 10 },
  { field: "commit_frequency", weight: 1, upper: 1000 },
  { field: "recent_release_count", weight: 0.5, upper: 26 },
  { field: "updated_issues_count", weight: 0.5, upper: 5000 },
  { field: "closed_issues_count", weight: 0.5, upper: 5000 },
  { field: "issue_comment_frequency", weight: 1, upper: 15 },
  { field: "github_mention_count", weight: 2, upper: 500000 },
];

/** zipfian normalization, the only distribution original_pike.yml uses. */
const zipf = (v) => Math.log(1 + v);

/** Bounds.Apply + Input.Value from internal/scorer/algorithm/input.go. */
function normalize(value, { upper, smallerIsBetter }) {
  const lower = 0;
  let v = Math.min(Math.max(value, lower), upper) - lower;
  const threshold = upper - lower;
  if (smallerIsBetter) v = threshold - v;
  return zipf(v) / zipf(threshold);
}

function resolveSlug() {
  if (slugArg) return slugArg;
  const remote = execSync("git remote get-url origin", {
    encoding: "utf8",
  }).trim();
  const m = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!m) throw new Error(`Cannot parse a GitHub slug from origin: ${remote}`);
  return m[1];
}

const API = "https://api.github.com";

async function gh(path, { search = false } = {}) {
  const res = await fetch(path.startsWith("http") ? path : API + path, {
    headers: {
      accept: search
        ? "application/vnd.github.cloak-preview+json"
        : "application/vnd.github+json",
      "user-agent": "motiq-criticality-score",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status} on ${path}`);
    err.status = res.status;
    throw err;
  }
  return { body: await res.json(), headers: res.headers };
}

/** Contributor count via the Link header's last page — avoids paging 5000 entries. */
async function contributorCount(slug) {
  const { body, headers } = await gh(
    `/repos/${slug}/contributors?per_page=1&anon=1`,
  );
  const link = headers.get("link") || "";
  const last = link.match(/[?&]page=(\d+)>; rel="last"/);
  return last ? Number(last[1]) : body.length;
}

/** Distinct orgs across the top contributors, matching the legacy signal's intent. */
async function orgCount(slug) {
  const { body: contributors } = await gh(
    `/repos/${slug}/contributors?per_page=25&anon=1`,
  );
  const logins = contributors.map((c) => c.login).filter(Boolean);
  const orgs = new Set();
  for (const login of logins) {
    try {
      const { body } = await gh(`/users/${login}/orgs?per_page=100`);
      for (const o of body) orgs.add(o.login);
    } catch {
      // A user with private org membership simply contributes nothing here.
    }
  }
  return orgs.size;
}

/**
 * Average commits per week over the trailing year.
 *
 * Counted from the commits endpoint via the Link header, NOT /stats/commit_activity.
 * The stats endpoints answer 202 ("computing, ask again") and for a low-traffic repo can
 * stay that way across many polls — which silently dropped the signal, and a dropped
 * signal leaves the denominator, so an impatient run reported a HIGHER score. Counting
 * commits is deterministic and reproduces upstream exactly (19 commits / 52 = 0.37).
 */
async function commitFrequency(slug) {
  const since = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
  const { body, headers } = await gh(
    `/repos/${slug}/commits?since=${since}&per_page=1`,
  );
  const last = (headers.get("link") || "").match(/[?&]page=(\d+)>; rel="last"/);
  // One page of one item means Link is absent: 0 or 1 commits, and body says which.
  const perWeek = (last ? Number(last[1]) : body.length) / 52;
  // Upstream rounds this signal to 2dp before scoring; without it we land 0.00005 low.
  return Math.round(perWeek * 100) / 100;
}

async function recentReleaseCount(slug) {
  const { body } = await gh(`/repos/${slug}/releases?per_page=100`);
  const yearAgo = Date.now() - 365 * 24 * 3600 * 1000;
  return body.filter((r) => Date.parse(r.published_at ?? r.created_at) > yearAgo)
    .length;
}

const iso = (daysAgo) =>
  new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().slice(0, 10);

async function searchCount(q) {
  const { body } = await gh(
    `/search/issues?q=${encodeURIComponent(q)}&per_page=1`,
  );
  return body.total_count;
}

/**
 * Comments per issue across issues touched in the last 90 days. Upstream divides total
 * comments by the number of updated issues; with zero updated issues the signal is
 * undefined rather than zero, so it is dropped.
 */
async function issueCommentFrequency(slug, updatedIssues) {
  // Upstream emits 0 here rather than omitting the signal, which keeps weight 1 in the
  // denominator. Dropping it instead was worth ~+0.02 of pure inflation.
  if (!updatedIssues) return 0;
  const { body } = await gh(
    `/repos/${slug}/issues/comments?since=${iso(90)}&per_page=100`,
  );
  return body.length / updatedIssues;
}

async function collect(slug) {
  const signals = {};
  const dropped = [];
  const record = async (field, fn) => {
    try {
      const v = await fn();
      if (v === null || Number.isNaN(v)) dropped.push([field, "not applicable"]);
      else signals[field] = v;
    } catch (e) {
      dropped.push([field, e.message]);
    }
  };

  const { body: repo } = await gh(`/repos/${slug}`);
  const months = (from) =>
    (Date.now() - Date.parse(from)) / (30.4375 * 24 * 3600 * 1000);

  // Upstream reports these as WHOLE months (legacy.created_since: 1 for a 1.7-month-old
  // repo). Keeping the fraction inflated the score against the reference implementation.
  signals.created_since = Math.floor(months(repo.created_at));
  signals.updated_since = Math.floor(months(repo.pushed_at));

  await record("contributor_count", () => contributorCount(slug));
  await record("org_count", () => orgCount(slug));
  await record("commit_frequency", () => commitFrequency(slug));
  await record("recent_release_count", () => recentReleaseCount(slug));
  await record("updated_issues_count", () =>
    searchCount(`repo:${slug} is:issue updated:>=${iso(90)}`),
  );
  await record("closed_issues_count", () =>
    searchCount(`repo:${slug} is:issue closed:>=${iso(90)}`),
  );
  await record("issue_comment_frequency", () =>
    issueCommentFrequency(slug, signals.updated_issues_count),
  );

  if (mentionsOverride !== undefined) {
    signals.github_mention_count = Number(mentionsOverride);
  } else {
    await record("github_mention_count", async () => {
      const { body } = await gh(
        `/search/commits?q=${encodeURIComponent(`"${slug}"`)}&per_page=1`,
        { search: true },
      );
      return body.total_count;
    });
  }

  return { repo, signals, dropped };
}

const slug = resolveSlug();
const { signals, dropped } = await collect(slug);

let numerator = 0;
let denominator = 0;
const rows = [];
for (const input of INPUTS) {
  const raw = signals[input.field];
  if (raw === undefined) continue;
  const n = normalize(raw, input);
  numerator += input.weight * n;
  denominator += input.weight;
  rows.push({
    field: input.field,
    raw,
    weight: input.weight,
    upper: input.upper,
    normalized: n,
    contribution: (input.weight * n) / 10.5,
  });
}
const score = denominator ? numerator / denominator : 0;

if (asJson) {
  console.log(
    JSON.stringify({ repo: slug, score, rows, dropped, signals }, null, 2),
  );
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\nOpenSSF criticality score — ${slug}\n`);
  console.log(
    `  ${pad("signal", 26)}${pad("value", 12)}${pad("threshold", 11)}${pad("weight", 8)}headroom`,
  );
  console.log(`  ${"-".repeat(69)}`);
  for (const r of rows) {
    const value =
      r.field.endsWith("_since") || r.field.endsWith("frequency")
        ? r.raw.toFixed(2)
        : r.raw;
    console.log(
      `  ${pad(r.field, 26)}${pad(value, 12)}${pad(r.upper, 11)}${pad(r.weight, 8)}${(
        (1 - r.normalized) *
        (r.weight / 10.5)
      ).toFixed(4)}`,
    );
  }
  console.log(`  ${"-".repeat(69)}`);
  console.log(`\n  score: ${score.toFixed(5)}   (critical-infrastructure bar: 0.4)\n`);
  if (dropped.length) {
    console.log(
      "  Dropped signals — upstream removes these from the denominator too, so the",
    );
    console.log("  score above is OPTIMISTIC by however much they would have cost:");
    for (const [field, why] of dropped) console.log(`    - ${field}: ${why}`);
    if (!token)
      console.log(
        "\n  Set GITHUB_TOKEN to collect the auth-only signals (commit search, org lookups).",
      );
    console.log("");
  }
}
