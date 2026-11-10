import { usePaseo } from "@getpaseo/plugin/client";
import { useEffect, useState } from "react";

type PaseoApi = ReturnType<typeof usePaseo>;
/** One row of the host's workspace list, as the SDK delivers it. */
export type WorkspaceEntry = Awaited<ReturnType<PaseoApi["workspaces"]["list"]>>["entries"][number];

/** Live workspace list for the selected host; `null` until the first snapshot. */
export function useWorkspaceList(): WorkspaceEntry[] | null {
  const paseo = usePaseo();
  const [entries, setEntries] = useState<WorkspaceEntry[] | null>(null);
  useEffect(() => {
    let active = true;
    let release: (() => Promise<void>) | undefined;
    void paseo.workspaces
      .list({ subscribe: {} })
      .then(({ subscription }) => {
        if (!active) return subscription.release();
        release = () => subscription.release();
        subscription.subscribe({
          snapshot: (snapshot) => setEntries(snapshot.entries),
          update: (message) => {
            if (message.type !== "workspace_update") return;
            const update = message.payload;
            setEntries((current) => {
              const removedId = update.kind === "upsert" ? update.workspace.id : update.id;
              const rest = (current ?? []).filter((entry) => entry.id !== removedId);
              return update.kind === "upsert" ? [...rest, update.workspace] : rest;
            });
          },
        });
        return undefined;
      })
      .catch((error: unknown) => {
        if (active) console.error("Workspace list failed", error);
      });
    return () => {
      active = false;
      void release?.();
    };
  }, [paseo]);
  return entries;
}
