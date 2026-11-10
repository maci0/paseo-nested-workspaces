import type { PluginClientContext } from "@getpaseo/plugin/client";
import { nestSidebarProjects } from "./client/web";

export default function contribute(client: PluginClientContext) {
  return nestSidebarProjects(async () =>
    (await client.paseo.projects.list()).projects.flatMap((project) =>
      project.projectKey === undefined ? [] : [{ key: project.projectKey, directory: project.projectRootPath }],
    ),
  );
}
