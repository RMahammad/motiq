# Documentation synchronization checklist

- [ ] Canonical owner identified (via [ownership map](./document-ownership-map.md)).
- [ ] Canonical doc updated; `Last reviewed` date bumped.
- [ ] Summarizers/links elsewhere refreshed (Grep the filename + topic keywords across `docs/`, `CLAUDE.md`, package `CLAUDE.md`).
- [ ] No canonical content duplicated into another file.
- [ ] Current-vs-planned markers accurate (🔵→🟢 where implemented; component inventory updated).
- [ ] Examples reference real exports/commands (or clearly marked Planned).
- [ ] ADR created/updated if this is a durable architectural decision; `adrs/README.md` table updated.
- [ ] Version/license claims carry a source + verification date.
- [ ] Ran: `check-links.mjs`, `check-adr-index.mjs`, `check-duplicate-titles.mjs`, `check-stale-dates.mjs` — all pass.
- [ ] Reported every file modified.
