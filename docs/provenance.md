# Provenance

Append-only ledger of changes to this plugin.

- 2026-11-10: initial plugin. Nesting rule copied from the DeepSeek harness workspace browser (`owningParentFolder` in `@deepseek-ai/dsh-client-ui-workspace` 0.2.2, nearest strict directory ancestor, case-sensitive). Rendered as a plugin screen because `addSidebarView` is on Paseo main (commit a449271d, 2026-11-07) but absent from the 0.15.4 SDK on npm. Verified: `bun test` (2 pass), `bun run typecheck` clean, `paseo plugin install` on daemon 0.15.3 reports `running`. Requested by the repository owner.
