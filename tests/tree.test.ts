import { expect, test } from "bun:test";
import { nest, owningParent } from "../client/tree";

test("owningParent picks the nearest strict ancestor", () => {
  const parents = ["/home/u", "/home/u/Projects", "/home/u/Projects/app", "/other"];
  expect(owningParent("/home/u/Projects/app/repos/x", parents)).toBe("/home/u/Projects/app");
  expect(owningParent("/home/u/Projects/app", parents)).toBe("/home/u/Projects");
  expect(owningParent("/home/u", parents)).toBeUndefined();
  expect(owningParent("/home/user", parents)).toBeUndefined();
  expect(owningParent("C:\\src\\app", ["C:\\src", "C:/src/app"])).toBe("C:\\src");
});

test("nest orders children after their parent and keeps sibling order", () => {
  const entry = (id: string, directory: string, scope = "host") => ({ id, directory, scope });
  const placed = nest([
    entry("web", "/acme/web"),
    entry("sdk", "/acme/api/vendor/sdk"),
    entry("acme", "/acme"),
    entry("notes", "/notes"),
    entry("api", "/acme/api"),
    entry("acme-again", "/acme/"),
    entry("other-host", "/acme/web/x", "host2"),
  ]);
  expect(placed.map(({ item, depth, parent }) => `${depth}:${item.id}<${parent?.id ?? ""}`)).toEqual([
    "0:acme<",
    "1:web<acme",
    "1:api<acme",
    "2:sdk<api",
    "0:notes<",
    "0:acme-again<",
    "0:other-host<",
  ]);
});
