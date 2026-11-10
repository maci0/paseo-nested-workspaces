import type { PluginClientContext } from "@getpaseo/plugin/client";
import { nestSidebarProjects } from "./client/web";

export default function contribute(_client: PluginClientContext) {
  return nestSidebarProjects();
}
