/**
 * Sidebar project keys, as the daemon's project list and the sidebar rows spell them:
 * `host:<serverId>:<absolute directory>` for a directory or a git checkout without a remote,
 * `remote:<host>/<owner>/<repo>` for a git project with a remote. Pure.
 */

const HOST_KEY_PREFIX = "host:";
/** Scope of a project list that holds no host key to read a server id from. */
const OWN_HOST_SCOPE = "own-host";

export interface ProjectLocation {
  /** Absolute directory in the host's spelling. */
  directory: string;
  /** Projects nest only under projects with the same scope (the host). */
  scope: string;
}

function hostKey(key: string): ProjectLocation | undefined {
  if (!key.startsWith(HOST_KEY_PREFIX)) return undefined;
  const rest = key.slice(HOST_KEY_PREFIX.length);
  const cut = rest.indexOf(":");
  const directory = rest.slice(cut + 1);
  const absolute = directory.startsWith("/") || /^[A-Za-z]:[/\\]/.test(directory) || directory.startsWith("\\\\");
  return cut > 0 && absolute ? { directory, scope: rest.slice(0, cut) } : undefined;
}

/** The scope shared by one host's project list: the server id its host keys carry. */
export function listScope(keys: Iterable<string>): string {
  for (const key of keys) {
    const parsed = hostKey(key);
    if (parsed) return parsed.scope;
  }
  return OWN_HOST_SCOPE;
}

/**
 * Where a sidebar project lives. `directories` maps the keys of this host's
 * project list to root directories and `scope` is that list's scope. A host
 * key missing from the list (another host's project) is read from the key
 * itself; any other unknown key has no location.
 */
export function locateProject(
  key: string,
  directories: ReadonlyMap<string, string>,
  scope: string,
): ProjectLocation | undefined {
  const directory = directories.get(key);
  if (directory === undefined) return hostKey(key);
  return { directory, scope: hostKey(key)?.scope ?? scope };
}
