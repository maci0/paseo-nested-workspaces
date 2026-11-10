# Nested workspaces

Nests the sidebar's workspace list by directory, like the "Workspace Tree" view of the DeepSeek harness. A project whose directory sits inside another project's directory is shown under that project, indented one level per step, together with its workspaces. Open `~/app` and `~/app/api` as two projects and `api` appears under `app`.

Nothing is added to the sidebar. The built-in list is rearranged in place, so rows keep their menus, status indicators and shortcuts. Folding a project also hides the projects nested under it. The list is also made more compact: rows are 28px high instead of 36px and the gap between projects shrinks from 12px to 2px. Plain folders and git repositories both nest, and projects on different hosts never nest under each other.

Works in the desktop app and the web app on Paseo 0.15.3 or later. On iOS and Android the plugin does nothing. Paseo has no released API for changing the built-in list, so the plugin restyles the list's elements directly and may need an update when Paseo changes the sidebar. Nested projects come after their parent's own workspaces. Reordering projects by dragging is untested with nesting on. The plugin runs only in the app. It reads the host's project list to learn each project's directory, stores nothing and sends nothing.
