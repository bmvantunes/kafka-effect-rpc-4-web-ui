"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  HEARTBEAT_STALE_AFTER_MS,
  type HeartbeatGroupQuery
} from "./heartbeat-rpc";
import { useHeartbeatEndpoint } from "./heartbeat-endpoint-context";
import {
  getHeartbeatGroupStore,
  type ConnectionStatus,
  type HeartbeatGroupStoreSnapshot
} from "./heartbeat-group-store";
import { useTick } from "./use-tick";

export type { ConnectionStatus } from "./heartbeat-group-store";

interface HeartbeatGroupSubscriptionState {
  readonly status: ConnectionStatus;
  readonly groups: HeartbeatGroupStoreSnapshot["groups"];
  readonly now: number;
}

export interface SystemBadgeState {
  readonly status: ConnectionStatus;
  readonly system: string;
  readonly minTimestamp: number | null;
  readonly stale: boolean;
  readonly tone: "healthy" | "stale" | "unknown";
}

export const useHeartbeatGroups = (
  query: HeartbeatGroupQuery
): HeartbeatGroupSubscriptionState => {
  const { wsUrl } = useHeartbeatEndpoint();
  const store = getHeartbeatGroupStore(query, wsUrl);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const now = useTick();

  return {
    status: snapshot.status,
    groups: snapshot.groups,
    now
  };
};

export const useSystemBadge = (system: string): SystemBadgeState => {
  const { groups, now, status } = useHeartbeatGroups({
    groupBy: "system",
    childGroupBy: null,
    filters: {
      ...EMPTY_HEARTBEAT_GROUP_FILTERS,
      system: [system]
    }
  });
  const group = groups.find((candidate) => candidate.key === system) ?? null;
  const minTimestamp = group?.minTimestamp ?? null;
  const stale =
    minTimestamp === null ? false : now - minTimestamp > HEARTBEAT_STALE_AFTER_MS;
  const tone =
    minTimestamp === null || status === "connecting"
      ? "unknown"
      : stale || status === "disconnected"
        ? "stale"
        : "healthy";

  return {
    status,
    system,
    minTimestamp,
    stale,
    tone
  };
};
