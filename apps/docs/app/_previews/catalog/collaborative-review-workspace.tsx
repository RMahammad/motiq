"use client";

import * as React from "react";

import { CollaborativeReviewWorkspace } from "@/registry/blocks/collaborative-review-workspace";

/**
 * Compact catalog adapter (docs/55). Renders the REAL CollaborativeReviewWorkspace
 * block in its default populated "open" state with the demo phase-preset control
 * bar hidden (showControls={false}). Full-width block layout; the block owns its
 * four composed components and inline fictional demo data.
 */

export function CollaborativeReviewWorkspaceCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <CollaborativeReviewWorkspace showControls={false} />
    </div>
  );
}

export default CollaborativeReviewWorkspaceCatalogPreview;
