# Brief — Kanban Card Movement

- **Tier:** Pro · **Category:** Productivity
- **Problem:** Board UIs bolt on a heavy drag library, ship drag-only (inaccessible) movement, and re-render every card during pointer moves.
- **Use case:** An **application-controlled** Kanban interaction layer — columns/cards supplied by the app; movement via pointer, touch, **or keyboard/menu**; optimistic move with failure rollback. Not a full PM app.
- **States:** idle · dragging · keyboard-moving · drop-valid · drop-invalid · optimistic-pending · move-failed (rollback) · empty column.
- **Interaction:** pointer drag, touch drag, keyboard move, move-menu alternative, cancel drag (Esc), drop validation, optimistic movement, failure rollback, drop indicators, add-card.
- **Animation purpose:** communicate pickup, move, drop, and rollback via transform-based layout animation; reduced-motion disables transforms.
- **API sketch:** `<KanbanCardMovement columns cards onMove(cardId,toColumnId,toIndex) moveValidation selectedCardId onAddCard />`; card = { id, columnId, title, order, disabled?, meta? }; column = { id, title, limit? }.
- **Accessibility:** **dragging never required** — keyboard/menu movement always available; announce origin + destination (aria-live); focus returns to the moved card; drop targets labelled; reduced motion; no colour-only column/status.
- **Mobile:** touch drag + a move-menu fallback; large targets.
- **Dependencies:** motion + `@motiq/{utils,primitives}` **only — no external drag library** (clean-room pointer/keyboard implementation).
- **Similarity concern:** boards are common, but the no-library, keyboard-first, optimistic-rollback design is original + clean-room. Medium — kept original (no copied APIs/effects).
- **Performance:** move only the dragged card via transform/ref (no per-pointermove React state); document virtualization for very large boards.
- **Release criteria:** 6 tests (move callback, invalid move, keyboard movement, rollback, focus preservation, non-drag alternative) + axe; rapid gate; Pro → protected registry routing.
