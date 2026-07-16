"use client";

import * as React from "react";

import { KpiNumberMorph } from "@/registry/data/kpi-number-morph";

/**
 * Compact catalog adapter (docs/55 §7). Three settled KPI tiles in their final
 * morphed values — no "Simulate update" / state-switch chrome. Idle state shows
 * the direction-aware trend row that is the component's signature.
 */
export function KpiNumberMorphCatalogPreview() {
  return (
    <div className="mx-auto grid w-full max-w-[760px] grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiNumberMorph
        label="Revenue"
        value={55240}
        currency="USD"
        notation="compact"
        change={17.5}
        changeAsPercent
        changeLabel="7d"
        className="min-w-0 p-5"
      />
      <KpiNumberMorph
        label="Users"
        value={14710}
        notation="compact"
        change={5.2}
        changeAsPercent
        changeLabel="7d"
        className="min-w-0 p-5"
      />
      <KpiNumberMorph
        label="Conversion"
        value={4.2}
        suffix="%"
        decimals={1}
        change={0.3}
        changeAsPercent
        changeLabel="7d"
        className="min-w-0 p-5"
      />
    </div>
  );
}

export default KpiNumberMorphCatalogPreview;
