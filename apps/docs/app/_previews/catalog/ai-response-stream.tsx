"use client";

import * as React from "react";

import { AiResponseStream, type ResponseSegment, type StreamSource } from "@/registry/ai/ai-response-stream";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL AiResponseStream in one
 * representative "complete" state — no Start/Stop/Simulate controls, trimmed to a
 * readable answer + one citation + a short snippet. Detail page keeps the full rig.
 */

const SOURCES: StreamSource[] = [
  { id: "1", title: "Engineering Handbook - Caching", url: "https://example.com/handbook", snippet: "Internal guide" },
];

const SEGMENTS: ResponseSegment[] = [
  {
    type: "text",
    text: "Yes - you can serve stale data instantly while refreshing it in the background. The pattern is called stale-while-revalidate",
  },
  { type: "citation", sourceId: "1" },
  { type: "text", text: ". A minimal wrapper:" },
  {
    type: "code",
    lang: "ts",
    filename: "swr-cache.ts",
    code: `export async function withSWR<T>(key, fetcher, ttl = 30_000) {\n  const hit = cache.get(key);\n  if (hit) return hit.value; // serve stale, revalidate quietly\n  return cache.set(key, await fetcher());\n}`,
  },
];

export function AiResponseStreamCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <AiResponseStream segments={SEGMENTS} state="complete" sources={SOURCES} assistantName="Atlas" />
    </div>
  );
}

export default AiResponseStreamCatalogPreview;
