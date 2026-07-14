"use client";

import * as React from "react";

import { CollaborativeReviewWorkspace } from "@/registry/blocks/collaborative-review-workspace";

/* Live block preview — renders the composed Collaborative Review Workspace with
 * its own inline fictional demo data. The block owns the state machine wiring
 * the four components together, so this preview only mounts it. */

export function CollaborativeReviewWorkspacePreview() {
  return (
    <div className="w-full max-w-[1040px]">
      <CollaborativeReviewWorkspace />
    </div>
  );
}

export default CollaborativeReviewWorkspacePreview;
