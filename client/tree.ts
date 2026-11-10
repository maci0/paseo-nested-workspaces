/**
 * Nest workspaces by directory containment, the way the DeepSeek harness
 * workspace browser does: a workspace sits under the nearest other workspace
 * whose directory contains its own. Pure; the screen renders the result.
 */

export interface TreeInput {
  id: string;
  directory: string;
}

export interface TreeNode<T extends TreeInput> {
  item: T;
  depth: number;
  children: TreeNode<T>[];
}

/** Normalize separators for comparison; a POSIX backslash is not a separator. */
function folderPath(path: string): string {
  const windows = /^[A-Za-z]:[/\\]/.test(path) || path.startsWith("\\\\");
  return (windows ? path.replaceAll("\\", "/") : path).replace(/\/+$/, "");
}

/** Nearest directory in `parents` that strictly contains `path`, or undefined. Case-sensitive. */
export function owningParent(path: string, parents: readonly string[]): string | undefined {
  const child = folderPath(path);
  let owner: string | undefined;
  let length = -1;
  for (const parent of parents) {
    const root = folderPath(parent);
    if (root.length > length && child !== root && child.startsWith(`${root}/`)) {
      owner = parent;
      length = root.length;
    }
  }
  return owner;
}

const byName = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

/**
 * Build the forest. Siblings sort by `label`, then id.
 */
export function buildTree<T extends TreeInput>(
  items: readonly T[],
  label: (item: T) => string,
): TreeNode<T>[] {
  const directories = [...new Set(items.map((item) => folderPath(item.directory)))];
  const childrenOf = new Map<string | undefined, T[]>();
  for (const item of items) {
    const parent = owningParent(item.directory, directories);
    const siblings = childrenOf.get(parent) ?? [];
    siblings.push(item);
    childrenOf.set(parent, siblings);
  }
  // Workspaces on one directory are siblings; the first of them carries that directory's children.
  const expanded = new Set<string>();
  const build = (parent: string | undefined, depth: number): TreeNode<T>[] =>
    (childrenOf.get(parent) ?? [])
      .sort((a, b) => byName.compare(label(a), label(b)) || byName.compare(a.id, b.id))
      .map((item) => {
        const directory = folderPath(item.directory);
        const children = expanded.has(directory) ? [] : build(directory, depth + 1);
        expanded.add(directory);
        return { item, depth, children };
      });
  return build(undefined, 0);
}
