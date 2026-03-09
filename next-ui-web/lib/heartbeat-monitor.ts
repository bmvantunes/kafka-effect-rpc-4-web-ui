import {
  HEARTBEAT_STALE_AFTER_MS,
  isHeartbeatHealthy,
  type HeartbeatGroup
} from "./heartbeat-rpc";

export type HealthTone = "healthy" | "stale";

export interface RegionSystemHealthView {
  readonly system: string;
  readonly minTimestamp: number;
  readonly maxTimestamp: number;
  readonly count: number;
  readonly ageMs: number;
  readonly stale: boolean;
  readonly status: HealthTone;
}

export interface RegionHealthView {
  readonly region: string;
  readonly minTimestamp: number;
  readonly newestTimestamp: number;
  readonly totalSystems: number;
  readonly healthySystems: number;
  readonly staleSystems: number;
  readonly processInstances: number;
  readonly stale: boolean;
  readonly status: HealthTone;
  readonly systems: ReadonlyArray<RegionSystemHealthView>;
}

export interface GroupHealthChildView {
  readonly key: string;
  readonly minTimestamp: number;
  readonly maxTimestamp: number;
  readonly count: number;
  readonly ageMs: number;
  readonly stale: boolean;
  readonly status: HealthTone;
}

export interface GroupHealthView {
  readonly key: string;
  readonly oldestTimestamp: number;
  readonly newestTimestamp: number;
  readonly totalChildren: number;
  readonly healthyChildren: number;
  readonly staleChildren: number;
  readonly processInstances: number;
  readonly stale: boolean;
  readonly status: HealthTone;
  readonly children: ReadonlyArray<GroupHealthChildView>;
}

export interface MonitorSummary {
  readonly regions: number;
  readonly healthyRegions: number;
  readonly staleRegions: number;
  readonly systems: number;
  readonly healthySystems: number;
  readonly staleSystems: number;
  readonly apps: number;
  readonly processInstances: number;
  readonly lastHeartbeatAt: number | null;
}

export const isFreshTimestamp = (
  timestamp: number,
  now = Date.now()
): boolean => isHeartbeatHealthy(timestamp, now);

export const formatTimestamp = (timestamp: number | null): string =>
  timestamp === null || !Number.isFinite(timestamp)
    ? "n/a"
    : new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

export const formatAge = (timestamp: number | null, now = Date.now()): string => {
  if (timestamp === null || !Number.isFinite(timestamp)) {
    return "n/a";
  }

  const ageMs = Math.max(0, now - timestamp);
  if (ageMs < 1_000) {
    return "just now";
  }

  const seconds = Math.floor(ageMs / 1_000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s ago`;
};

export const deriveRegionHealthViews = (
  regions: ReadonlyArray<HeartbeatGroup>,
  now = Date.now()
): ReadonlyArray<RegionHealthView> =>
  regions
    .map((region) => {
      const systems = region.children
        .map((system) => {
          const stale = !isFreshTimestamp(system.minTimestamp, now);
          return {
            system: system.key,
            minTimestamp: system.minTimestamp,
            maxTimestamp: system.maxTimestamp,
            count: system.count,
            ageMs: Math.max(0, now - system.minTimestamp),
            stale,
            status: stale ? "stale" : "healthy"
          } satisfies RegionSystemHealthView;
        })
        .sort((left, right) => left.system.localeCompare(right.system));

      const healthySystems = systems.filter((system) => !system.stale).length;
      const stale = !isFreshTimestamp(region.minTimestamp, now);

      return {
        region: region.key,
        minTimestamp: region.minTimestamp,
        newestTimestamp: region.maxTimestamp,
        totalSystems: systems.length,
        healthySystems,
        staleSystems: systems.length - healthySystems,
        processInstances: region.count,
        stale,
        status: stale ? "stale" : "healthy",
        systems
      } satisfies RegionHealthView;
    })
    .sort((left, right) => left.region.localeCompare(right.region));

export const deriveGroupHealthViews = (
  groups: ReadonlyArray<HeartbeatGroup>,
  now = Date.now()
): ReadonlyArray<GroupHealthView> =>
  groups
    .map((group) => {
      const children = group.children
        .map((child) => {
          const stale = !isFreshTimestamp(child.minTimestamp, now);
          return {
            key: child.key,
            minTimestamp: child.minTimestamp,
            maxTimestamp: child.maxTimestamp,
            count: child.count,
            ageMs: Math.max(0, now - child.minTimestamp),
            stale,
            status: stale ? "stale" : "healthy"
          } satisfies GroupHealthChildView;
        })
        .sort((left, right) => left.key.localeCompare(right.key));

      const healthyChildren = children.filter((child) => !child.stale).length;
      const stale = !isFreshTimestamp(group.minTimestamp, now);

      return {
        key: group.key,
        oldestTimestamp: group.minTimestamp,
        newestTimestamp: group.maxTimestamp,
        totalChildren: children.length,
        healthyChildren,
        staleChildren: children.length - healthyChildren,
        processInstances: group.count,
        stale,
        status: stale ? "stale" : "healthy",
        children
      } satisfies GroupHealthView;
    })
    .sort((left, right) => left.key.localeCompare(right.key));

export const summarizeMonitor = (
  regions: ReadonlyArray<HeartbeatGroup>,
  systems: ReadonlyArray<HeartbeatGroup>,
  apps: ReadonlyArray<HeartbeatGroup>,
  now = Date.now()
): MonitorSummary => {
  const regionViews = deriveRegionHealthViews(regions, now);
  const systemViews = deriveGroupHealthViews(systems, now);
  const appViews = deriveGroupHealthViews(apps, now);
  const lastHeartbeatAt =
    regions.length === 0
      ? null
      : Math.max(...regions.map((region) => region.maxTimestamp));

  return {
    regions: regionViews.length,
    healthyRegions: regionViews.filter((region) => !region.stale).length,
    staleRegions: regionViews.filter((region) => region.stale).length,
    systems: systemViews.length,
    healthySystems: systemViews.filter((system) => !system.stale).length,
    staleSystems: systemViews.filter((system) => system.stale).length,
    apps: appViews.length,
    processInstances: regionViews.reduce(
      (count, region) => count + region.processInstances,
      0
    ),
    lastHeartbeatAt
  };
};

export const formatFreshnessWindow = () =>
  `${Math.round(HEARTBEAT_STALE_AFTER_MS / 1000)}s`;
