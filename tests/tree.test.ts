import { expect, test } from "bun:test";
import { buildTree, owningParent } from "../client/tree";

test("owningParent picks the nearest strict ancestor", () => {
  const parents = ["/home/u", "/home/u/Projects", "/home/u/Projects/app", "/other"];
  expect(owningParent("/home/u/Projects/app/repos/x", parents)).toBe("/home/u/Projects/app");
  expect(owningParent("/home/u/Projects/app", parents)).toBe("/home/u/Projects");
  expect(owningParent("/home/u", parents)).toBeUndefined();
  expect(owningParent("/home/user", parents)).toBeUndefined();
  expect(owningParent("C:\\src\\app", ["C:\\src", "C:/src/app"])).toBe("C:\\src");
});

test("buildTree nests by containment and keeps same-directory workspaces as siblings", () => {
  const ws = (id: string, directory: string) => ({ id, directory });
  const tree = buildTree(
    [
      ws("b", "/home/u/Projects/app"),
      ws("a", "/home/u"),
      ws("c", "/home/u/Projects/app/repos/x"),
      ws("d", "/home/u"),
      ws("e", "/elsewhere"),
    ],
    (item) => item.directory,
  );
  const flat = (nodes: ReturnType<typeof buildTree<{ id: string; directory: string }>>): string[] =>
    nodes.flatMap((node) => [`${node.depth}:${node.item.id}`, ...flat(node.children)]);
  expect(flat(tree)).toEqual(["0:e", "0:a", "1:b", "2:c", "0:d"]);
});
