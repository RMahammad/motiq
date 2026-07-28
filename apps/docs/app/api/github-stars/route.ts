// Public star-count route for the "Star on GitHub" surfaces.
//
// GET /api/github-stars -> { stars: number | null }
//
// The count is fetched server-side and cached for an hour so visitor browsers
// never hit api.github.com directly (that would burn the anonymous 60/hour
// rate limit per visitor and leak visitor IPs to GitHub). Any failure — rate
// limit, network, renamed repo — resolves to `stars: null` with a 200 so the
// UI simply hides the count instead of showing an error.
//
// Set GITHUB_TOKEN to raise the server-side rate limit; the token is read only
// here and never reaches the client.
import { NextResponse } from "next/server";

import { github } from "../../../lib/github";

const CACHE_SECONDS = 3600;

export const revalidate = 3600;

interface RepoResponse {
  stargazers_count?: unknown;
}

export async function GET() {
  const empty = NextResponse.json(
    { stars: null },
    { headers: { "cache-control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400` } },
  );

  if (!github.apiUrl) return empty;

  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "motiq-docs",
  };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(github.apiUrl, { headers, next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) return empty;
    const body = (await res.json()) as RepoResponse;
    const stars = body.stargazers_count;
    if (typeof stars !== "number" || !Number.isFinite(stars)) return empty;
    return NextResponse.json(
      { stars },
      { headers: { "cache-control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400` } },
    );
  } catch {
    // Offline builds and GitHub outages must not break the page — the count is
    // decoration, the link is the feature.
    return empty;
  }
}
