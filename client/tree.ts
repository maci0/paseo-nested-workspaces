/**
 * Nest entries by directory containment, the way the DeepSeek harness
 * "Workspace Tree" does: an entry sits under the nearest other entry whose
 * directory contains its own. Pure; `web.ts` applies the result to the sidebar.
 */

export interface NestInput {
  /** Absolute directory in the host's spelling. */
  directory: string;
  /** Entries nest only under entries with the same scope (the host). */
  scope: string;
}

export interface Nested<T> {
  item: T;
  depth: number;
  parent: T | undefined;
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

/**
 * Depth-first order with each entry after its parent. Siblings keep their
 * input order. Entries sharing one directory are siblings; the first of them
 * is the parent of that directory's children.
 */
export function nest<T extends NestInput>(items: readonly T[]): Nested<T>[] {
  const scopes = new Map<string, Map<string, T>>();
  for (const item of items) {
    const owners = scopes.get(item.scope) ?? new Map<string, T>();
    const directory = folderPath(item.directory);
    if (!owners.has(directory)) owners.set(directory, item);
    scopes.set(item.scope, owners);
  }
  const childrenOf = new Map<T | undefined, T[]>();
  for (const item of items) {
    const owners = scopes.get(item.scope) ?? new Map<string, T>();
    const owner = owningParent(item.directory, [...owners.keys()]);
    const parent = owner === undefined ? undefined : owners.get(owner);
    const siblings = childrenOf.get(parent) ?? [];
    siblings.push(item);
    childrenOf.set(parent, siblings);
  }
  const walk = (parent: T | undefined, depth: number): Nested<T>[] =>
    (childrenOf.get(parent) ?? []).flatMap((item) => [
      { item, depth, parent },
      ...walk(item, depth + 1),
    ]);
  return walk(undefined, 0);
}
