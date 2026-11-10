/**
 * Web and desktop only: nests the sidebar's project sections in place.
 *
 * Released Paseo has no API to change the built-in workspace list, so this
 * matches each project row's test id to the host's project list and sets `order`,
 * `padding-left` and `display` on the section. Nodes are never moved, so
 * React keeps owning the list. An unrecognized structure is left untouched.
 * A scoped stylesheet tightens the list's vertical spacing.
 */
import { Platform } from "react-native";
import { listScope, locateProject } from "./project-key";
import { nest } from "./tree";

const LIST_SELECTOR = '[data-testid="sidebar-project-workspace-list-scroll"]';
const ROW_TEST_ID_PREFIX = "sidebar-project-row-";
const WORKSPACE_ROW_TEST_ID_PREFIX = "sidebar-workspace-row-";
const SECTION_SELECTOR = '[role="group"]';
const INDENT_PX = 12;
// Paseo's own values are 36, 8 and 12 (plus 4 and 2 of row margin, dropped here).
const ROW_MIN_HEIGHT_PX = 28;
const ROW_PADDING_Y_PX = 4;
const SECTION_GAP_PX = 2;

const rows = [ROW_TEST_ID_PREFIX, WORKSPACE_ROW_TEST_ID_PREFIX]
  .map((prefix) => `${LIST_SELECTOR} [data-testid^="${prefix}"]`)
  .join(", ");
// ponytail: one density for pointer and touch; split by layout if 28px rows prove too small to tap.
const COMPACT_CSS = `
${rows} {
  min-height: ${ROW_MIN_HEIGHT_PX}px !important;
  padding-top: ${ROW_PADDING_Y_PX}px !important;
  padding-bottom: ${ROW_PADDING_Y_PX}px !important;
  margin-bottom: 0 !important;
}
${LIST_SELECTOR} ${SECTION_SELECTOR} { padding-bottom: ${SECTION_GAP_PX}px !important; }
`;

// The DOM members this module uses; the project compiles without the DOM lib.
interface SectionStyle {
  order: string;
  paddingLeft: string;
  display: string;
}
interface DomElement {
  readonly children: { readonly length: number };
  readonly parentElement: DomElement | null;
  readonly style: SectionStyle;
  closest(selector: string): DomElement | null;
  contains(node: unknown): boolean;
  getAttribute(name: string): string | null;
  querySelector(selector: string): DomElement | null;
  querySelectorAll(selector: string): Iterable<DomElement>;
}
interface DomMutationObserver {
  observe(target: DomElement, options: { childList: boolean; subtree: boolean }): void;
  disconnect(): void;
}
interface DomStyleElement {
  textContent: string | null;
  remove(): void;
}
declare const document:
  | (DomElement & {
      readonly body: DomElement;
      readonly head: { appendChild(node: DomStyleElement): unknown };
      createElement(tag: "style"): DomStyleElement;
    })
  | undefined;
declare const MutationObserver: new (
  callback: (records: readonly { readonly target: unknown }[]) => void,
) => DomMutationObserver;

/** One project of the host's project list: its sidebar key and root directory. */
export interface ListedProject {
  key: string;
  directory: string;
}

interface Section {
  /** Flex item of the project list; carries the styles. */
  element: DomElement;
  /** Holds the project row and, while unfolded, its workspace rows. */
  group: DomElement;
  /** Sidebar project key, the row test id without its prefix. */
  key: string;
  /** False when the key has no known directory; such a project stays at the top level. */
  located: boolean;
  directory: string;
  scope: string;
}

function readSections(list: DomElement, locate: (key: string) => { directory: string; scope: string } | undefined): Section[] {
  const sections: Section[] = [];
  for (const row of list.querySelectorAll(`[data-testid^="${ROW_TEST_ID_PREFIX}"]`)) {
    const group = row.closest(SECTION_SELECTOR);
    const element = group?.parentElement;
    if (!group || !element?.parentElement) return [];
    const key = (row.getAttribute("data-testid") ?? "").slice(ROW_TEST_ID_PREFIX.length);
    const location = locate(key);
    sections.push({
      element,
      group,
      key,
      located: location !== undefined,
      ...(location ?? { directory: "", scope: `unnested:${sections.length}` }),
    });
  }
  const container = sections[0]?.element.parentElement;
  return sections.every((section) => section.element.parentElement === container) ? sections : [];
}

function setStyle(element: DomElement, next: SectionStyle): void {
  if (element.style.order !== next.order) element.style.order = next.order;
  if (element.style.paddingLeft !== next.paddingLeft) element.style.paddingLeft = next.paddingLeft;
  if (element.style.display !== next.display) element.style.display = next.display;
}

const UNSTYLED: SectionStyle = { order: "", paddingLeft: "", display: "" };

/**
 * Start nesting the sidebar project list. `listProjects` reads the host's
 * project list; it is called once at start and again when a row appears whose
 * key the last result did not hold. Returns the cleanup that restores the list.
 */
export function nestSidebarProjects(listProjects: () => Promise<ListedProject[]>): () => void {
  if (Platform.OS !== "web" || typeof document === "undefined") return () => {};
  const page = document;
  const styled = new Set<DomElement>();
  const directories = new Map<string, string>();
  // Keys already looked up; one missing from the list is not asked for again.
  const asked = new Set<string>();
  let scope = listScope([]);
  let loading = false;
  let stopped = false;
  let list: DomElement | null = null;
  let frame: number | undefined;
  const compact = page.createElement("style");
  compact.textContent = COMPACT_CSS;
  page.head.appendChild(compact);

  const apply = (): void => {
    frame = undefined;
    list = page.querySelector(LIST_SELECTOR);
    const current = new Set<DomElement>();
    const folded = new Set<Section>();
    const sections = list ? readSections(list, (key) => locateProject(key, directories, scope)) : [];
    const unknown = sections.filter((section) => !section.located && !asked.has(section.key));
    if (unknown.length > 0 && !loading) load(unknown.map((section) => section.key));
    nest(sections).forEach(({ item, depth, parent }, index) => {
      // A folded project keeps only its row; its nested projects fold with it.
      const hidden = parent !== undefined && (folded.has(parent) || parent.group.children.length < 2);
      if (hidden) folded.add(item);
      setStyle(item.element, {
        order: String(index + 1),
        paddingLeft: depth === 0 ? "" : `${depth * INDENT_PX}px`,
        display: hidden ? "none" : "",
      });
      current.add(item.element);
    });
    for (const element of styled) if (!current.has(element)) setStyle(element, UNSTYLED);
    styled.clear();
    for (const element of current) styled.add(element);
  };

  const load = (keys: readonly string[]): void => {
    loading = true;
    for (const key of keys) asked.add(key);
    void listProjects()
      .then((projects) => {
        directories.clear();
        for (const project of projects) directories.set(project.key, project.directory);
        scope = listScope(directories.keys());
        loading = false;
        if (!stopped && frame === undefined) frame = requestAnimationFrame(apply);
        return undefined;
      })
      .catch((error: unknown) => {
        // No re-apply here: the next change to the list retries these keys, a failing host is not polled.
        loading = false;
        for (const key of keys) asked.delete(key);
        console.error("nested-workspaces: reading the project list failed", error);
      });
  };

  const observer = new MutationObserver((records) => {
    if (frame !== undefined) return;
    // Ignore the rest of the app (streaming chat) while the list is mounted.
    const watched = list;
    if (watched?.parentElement && page.contains(watched) && !records.some((record) => watched.contains(record.target))) return;
    frame = requestAnimationFrame(apply);
  });
  observer.observe(page.body, { childList: true, subtree: true });
  load([]);
  apply();

  return () => {
    stopped = true;
    observer.disconnect();
    compact.remove();
    if (frame !== undefined) cancelAnimationFrame(frame);
    for (const element of styled) setStyle(element, UNSTYLED);
    styled.clear();
  };
}
