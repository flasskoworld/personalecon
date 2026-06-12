/**
 * useCloudSync — Local-first cloud sync for the financial plan.
 *
 * Strategy:
 * 1. On mount (when user is authenticated): load from cloud. If cloud has a newer
 *    version than localStorage, merge by taking the newer one (last-write-wins by
 *    clientUpdatedAt timestamp).
 * 2. On every state change: debounce 3s then push to cloud.
 * 3. If the user is not logged in: no-op (localStorage only).
 *
 * The `clientUpdatedAt` field is the ms-since-epoch timestamp stored in the
 * AppState.lastUpdated ISO string — we convert it to a number for comparison.
 */

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AppState, loadState, saveState } from "@/lib/peStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const DEBOUNCE_MS = 3000;

function toMs(isoOrMs: string | number | undefined): number {
  if (!isoOrMs) return 0;
  if (typeof isoOrMs === "number") return isoOrMs;
  const parsed = Date.parse(isoOrMs);
  return isNaN(parsed) ? 0 : parsed;
}

interface UseCloudSyncOptions {
  /** The current in-memory state to watch for changes */
  state: AppState;
  /** Called when the cloud has a newer plan that should replace local state */
  onCloudLoad: (cloudState: AppState) => void;
}

export function useCloudSync({ state, onCloudLoad }: UseCloudSyncOptions) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const saveMutation = trpc.plan.save.useMutation({
    onError: (err) => {
      console.warn("[CloudSync] Save failed:", err.message);
    },
  });

  // Load from cloud on first authenticated mount
  const loadQuery = trpc.plan.load.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: Infinity, // only load once per session
    retry: 1,
  });

  const hasMergedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasMergedRef.current) return;
    if (loadQuery.isLoading || loadQuery.isError) return;
    if (!loadQuery.data) return;

    hasMergedRef.current = true;

    const { planData, clientUpdatedAt } = loadQuery.data;
    if (!planData || !clientUpdatedAt) return;

    const localState = loadState();
    const localMs = toMs(localState.lastUpdated);
    const cloudMs = clientUpdatedAt;

    if (cloudMs > localMs) {
      // Cloud is newer — load it
      try {
        const cloudState = JSON.parse(planData) as AppState;
        // Only load if it's a real plan (not a demo)
        if (cloudState.setupComplete && !cloudState.isDemo) {
          saveState(cloudState); // persist to localStorage too
          onCloudLoad(cloudState);
          toast.success("Your plan was restored from the cloud.", { duration: 3000 });
        }
      } catch (err) {
        console.warn("[CloudSync] Failed to parse cloud plan:", err);
      }
    }
    // If local is newer or equal, do nothing — local wins
  }, [isAuthenticated, loadQuery.isLoading, loadQuery.isError, loadQuery.data]);

  // Debounced auto-save on state changes
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const scheduleSave = useCallback(() => {
    if (!isAuthenticated) return;
    if (!state.setupComplete || state.isDemo) return;

    const serialized = JSON.stringify(state);
    if (serialized === lastSavedRef.current) return; // no change

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const clientUpdatedAt = toMs(state.lastUpdated) || Date.now();
      saveMutation.mutate(
        { planData: serialized, clientUpdatedAt },
        {
          onSuccess: (result) => {
            if (result.saved) {
              lastSavedRef.current = serialized;
            } else if (result.serverPlanData) {
              // Server has a newer version — offer to restore
              try {
                const serverState = JSON.parse(result.serverPlanData) as AppState;
                if (serverState.setupComplete && !serverState.isDemo) {
                  toast("A newer version of your plan exists in the cloud.", {
                    action: {
                      label: "Restore",
                      onClick: () => {
                        saveState(serverState);
                        onCloudLoad(serverState);
                        toast.success("Cloud plan restored.");
                      },
                    },
                    duration: 8000,
                  });
                }
              } catch {}
            }
          },
        }
      );
    }, DEBOUNCE_MS);
  }, [isAuthenticated, state, saveMutation, onCloudLoad]);

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scheduleSave]);

  return {
    isSyncing: saveMutation.isPending,
    lastSyncError: saveMutation.error,
  };
}
