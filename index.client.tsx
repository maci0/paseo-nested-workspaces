import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { NestedWorkspaces } from "./client/screen";

const SCREEN_ID = "tree";

function TreeItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="FolderTree"
      active={currentScreen?.screenId === SCREEN_ID}
      onPress={() => openScreen({ screenId: SCREEN_ID })}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: SCREEN_ID, title: "Nested workspaces", Component: NestedWorkspaces });
  client.addSidebarHeaderItem({ id: SCREEN_ID, title: "Nested workspaces", Component: TreeItem });
  return () => {};
}
