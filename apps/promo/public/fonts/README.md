# Promo fonts

The campaign renderer vendors the Latin variable subsets of **Geist** and
**Geist Mono** so renders never depend on a network request or a machine's
installed fonts.

- Files: `geist-latin.woff2`, `geist-mono-latin.woff2`
- Upstream: <https://github.com/vercel/geist-font>
- License: SIL Open Font License 1.1
- Vendored from the existing `next@16.2.10` workspace dependency on 2026-08-01.

These files are render inputs for the private `apps/promo` workspace and are
not included in any Motiq registry item or package output.
