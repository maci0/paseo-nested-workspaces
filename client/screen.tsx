import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { buildTree, type TreeNode } from "./tree";
import { useWorkspaceList, type WorkspaceEntry } from "./workspaces";

const INDENT = 14;
const ROW_MIN_HEIGHT = 28;

interface Workspace {
  id: string;
  directory: string;
  name: string;
  title: string | null;
}

function toWorkspace(entry: WorkspaceEntry): Workspace {
  return {
    id: entry.id,
    directory: entry.workspaceDirectory,
    name: entry.name,
    title: entry.title ?? null,
  };
}

export function NestedWorkspaces({ theme, layout, navigation }: PluginScreenProps) {
  const entries = useWorkspaceList();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);
  const tree = useMemo(
    () => (entries ? buildTree(entries.map(toWorkspace), (item) => item.name) : null),
    [entries],
  );
  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: { paddingVertical: layout.compact ? 8 : 12 },
      row: {
        minHeight: ROW_MIN_HEIGHT,
        paddingHorizontal: 12,
        paddingVertical: 4,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 6,
      },
      chevron: { width: 16, color: theme.colors.foregroundMuted, fontSize: 12 },
      name: { color: theme.colors.foreground, fontSize: 13, lineHeight: 18 },
      title: { color: theme.colors.foregroundMuted, fontSize: 11, lineHeight: 14 },
      labels: { flex: 1 },
      empty: { color: theme.colors.foregroundMuted, padding: 16 },
    }),
    [theme, layout.compact],
  );

  const renderNode = (node: TreeNode<Workspace>): ReactNode => {
    const { item } = node;
    const folded = collapsed.has(item.id);
    const hasChildren = node.children.length > 0;
    return (
      <View key={item.id}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title ?? item.name}`}
          onPress={() => navigation?.openWorkspace({ workspaceId: item.id })}
          style={[styles.row, { paddingLeft: 12 + node.depth * INDENT }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${folded ? "Expand" : "Collapse"} ${item.name}`}
            disabled={!hasChildren}
            hitSlop={8}
            onPress={() => toggle(item.id)}
          >
            <Text style={styles.chevron}>{hasChildren ? (folded ? "▸" : "▾") : " "}</Text>
          </Pressable>
          <View style={styles.labels}>
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>
            {item.title ? (
              <Text numberOfLines={1} style={styles.title}>
                {item.title}
              </Text>
            ) : null}
          </View>
        </Pressable>
        {folded ? null : node.children.map(renderNode)}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {tree === null ? (
        <Text style={styles.empty}>Loading workspaces…</Text>
      ) : tree.length === 0 ? (
        <Text style={styles.empty}>No workspaces on this host.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>{tree.map(renderNode)}</ScrollView>
      )}
    </View>
  );
}
