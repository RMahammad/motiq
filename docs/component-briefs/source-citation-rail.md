# Brief — Source Citation Rail

- **Problem:** AI answers and research UIs need to attribute sources with inline markers ↔ a source rail, without the product inventing citations, verification, or retrieval.
- **Use case:** AI answer citations, research source lists, doc references, retrieval results, evidence-backed summaries, search attribution.
- **Main states:** default · active source selected · excerpt expanded · new source inserted · empty. Layouts: inline markers · side rail · compact list · expandable cards · mobile stacked/bottom panel.
- **Main interaction:** select citation (marker or rail), highlight active, open-source callback, expand excerpt (`useDisclosure`), copy source link (`useCopy`), keyboard nav, controlled `activeSourceId` synced with inline markers.
- **Animation purpose:** citation selection, rail nav, source expansion, new-source insertion, active-marker relationship. No bouncing/scanning/pulsing; no motion implying verification.
- **API sketch:** `sources: Source[]` ({id, index, title, domain?, url?, type?, excerpt?, author?, publishedAt?, retrievedAt?, relevance?, thumbnail?, favicon?, location?, verified?}), `activeSourceId?`, `onActiveSourceChange?`, `onOpenSource?`, `layout?`, `showExcerpts?`, `renderMarker?`, `renderSource?`, `formatDate?`, `mobileBehavior?`.
- **Accessibility:** semantic `<a>` when a URL is provided + external-link labeling; keyboard source selection; focus-visible; meaningful names; active state not color-only; reduced-motion; the component never asserts verification (only shows an app-provided `verified` state, labeled as such).
- **Mobile:** rail collapses to a stacked/bottom panel; markers remain tappable.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives` (useCopy, useDisclosure, useReducedMotion). No new deps.
- **Similarity concern:** citation UIs are generic; differentiate via marker↔rail sync + layout modes. Low.
- **Tier:** Free.
- **Release criteria:** rapid gate (render, interactions, responsive, themes, reduced-motion, keyboard, typecheck, build, registry validate, clean-fixture, no console/hydration errors, clean-room). No invented sources/verification/confidence.
