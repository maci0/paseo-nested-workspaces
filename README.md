# paseo-nested-workspaces

Paseo plugin that shows workspaces as a directory tree, nested like the DeepSeek harness workspace browser.

A workspace whose directory lies inside another workspace's directory is listed under it. `~` contains `~/Projects`, which contains `~/Projects/app`, so the three workspaces stack three deep. Rows open the workspace; chevrons fold subtrees.

Client-only. Needs Paseo 0.15.3 or later; the tree is a plugin screen opened from a sidebar row. A sidebar view replacing the built-in list waits for the `addSidebarView` API that is on Paseo's main branch but not in a release yet.

```bash
bun install
bun test
bun run typecheck
paseo plugin install /absolute/path/to/paseo-nested-workspaces
```

The plugin ID is `nested-workspaces`. Plugins are unsandboxed; the daemon has to run with plugins enabled.

Changes are recorded in [docs/provenance.md](docs/provenance.md).
