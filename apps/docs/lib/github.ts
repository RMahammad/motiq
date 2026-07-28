// GitHub repository identity for the docs site.
//
// The repository URL comes from product.config.json (the single source of truth
// for brand identity) — never hardcode owner/repo in components or pages. Every
// "Star on GitHub" surface reads from here, so moving the repo is a config edit.

import { product } from "./product";

function parseRepo(url: string | undefined): { owner: string; repo: string } | null {
  const match = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/.exec(url ?? "");
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

const parsed = parseRepo(product.githubUrl);

export const github = {
  /** Null when product.githubUrl is not a repository URL — callers degrade to a plain link. */
  owner: parsed?.owner ?? null,
  repo: parsed?.repo ?? null,
  /** `owner/repo`, the form shown in UI next to the star count. */
  slug: parsed ? `${parsed.owner}/${parsed.repo}` : null,
  repoUrl: product.githubUrl,
  /** GitHub has no one-click "star" URL; the repo page is where the Star button lives. */
  starUrl: product.githubUrl,
  stargazersUrl: `${product.githubUrl}/stargazers`,
  apiUrl: parsed ? `https://api.github.com/repos/${parsed.owner}/${parsed.repo}` : null,
} as const;

/** Compact star count: 942, 1.2k, 14k. Returns null for a missing count so callers can hide the pill. */
export function formatStars(count: number | null | undefined): string | null {
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) return null;
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10}k`;
}
