"use client";

import * as React from "react";

import { track, type AnalyticsEvent } from "../../lib/analytics";

/** Fires a single analytics view event on mount. Renders nothing. */
export function PageView({ event, props }: { event: AnalyticsEvent; props?: Record<string, string> }) {
  React.useEffect(() => {
    track(event, props);
    // once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
