import { expect, test } from "bun:test";
import { listScope, locateProject } from "../client/project-key";

const directories = new Map([
  ["host:srv_a:/home/u/Projects", "/home/u/Projects"],
  ["remote:github.com/u/app", "/home/u/Projects/app"],
]);

test("a remote key resolves through the project list, in the list's scope", () => {
  const scope = listScope(directories.keys());
  expect(scope).toBe("srv_a");
  expect(locateProject("remote:github.com/u/app", directories, scope)).toEqual({
    directory: "/home/u/Projects/app",
    scope: "srv_a",
  });
  expect(locateProject("host:srv_a:/home/u/Projects", directories, scope)).toEqual({
    directory: "/home/u/Projects",
    scope: "srv_a",
  });
});

test("unknown keys: a host key is read from the key, anything else has no location", () => {
  expect(locateProject("host:srv_b:/srv/x", directories, "srv_a")).toEqual({ directory: "/srv/x", scope: "srv_b" });
  expect(locateProject("host:srv_b:C:\\src\\x", directories, "srv_a")).toEqual({ directory: "C:\\src\\x", scope: "srv_b" });
  expect(locateProject("remote:github.com/u/other", directories, "srv_a")).toBeUndefined();
  expect(locateProject("host:srv_b:relative", directories, "srv_a")).toBeUndefined();
  expect(listScope(["remote:github.com/u/app"])).toBe("own-host");
});
