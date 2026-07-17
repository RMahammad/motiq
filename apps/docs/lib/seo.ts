// Single source of truth for SEO / social metadata across the docs site.
// Everything canonical, Open Graph, and Twitter-related flows through here so
// every route emits consistent, absolute URLs. The origin is derived from the
// product config's registry base URL (…/r → origin) and can be overridden with
// NEXT_PUBLIC_SITE_URL for preview deployments.
import type { Metadata } from "next";

import { product } from "./product";

function deriveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  try {
    return new URL(product.registryBaseUrl).origin;
  } catch {
    return "https://motionstack.dev";
  }
}

/** Absolute origin of the deployed site, no trailing slash (e.g. https://motionstack.dev). */
export const siteUrl = deriveOrigin();

/** Resolve a root-relative path to an absolute URL against the site origin. */
export function absoluteUrl(path = "/"): string {
  return new URL(path || "/", `${siteUrl}/`).toString();
}

interface PageSeoInput {
  title: string;
  description: string;
  /** Root-relative path for the canonical URL (e.g. "/components/blur-text"). */
  path: string;
  /** Override the default OG type (defaults to "website"). */
  type?: "website" | "article";
  /** Set true for functional/duplicate pages that should not be indexed. */
  noIndex?: boolean;
}

/**
 * Build a complete Metadata object for a page: canonical URL, Open Graph, and
 * Twitter card. The site-wide OG image (app/opengraph-image.tsx) is attached
 * automatically by Next's file convention, so images are intentionally omitted.
 */
export function pageMetadata({ title, description, path, type = "website", noIndex }: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: product.productName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
