# Changesets

This folder holds [changesets](https://github.com/changesets/changesets). Add one for any
public-API change (`pnpm changeset`) — it drives versioning + the changelog. Required by CI for
public-package changes ([docs/14](../docs/14-testing-strategy.md), [docs/18](../docs/18-release-process.md)).

`access` is `restricted` because these are private/paid packages ([docs/16](../docs/16-commercial-packaging.md)).

`privatePackages.version` is `true` because **every** package here is private, and
changesets v3 stopped versioning private packages by default. Without it `changeset
status` reports nothing at all and pending changesets are silently ignored — no CI job
runs changesets, so nothing would catch that. Remove the setting only if these packages
stop being private.
