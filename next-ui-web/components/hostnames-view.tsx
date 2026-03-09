"use client";

import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  type HeartbeatGroupQuery
} from "../../shared/heartbeat-contract";
import { DimensionCatalogueView } from "./dimension-catalogue-view";

const HOSTNAMES_QUERY = {
  groupBy: "hostname",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

export const HostnamesView = () => (
  <DimensionCatalogueView
    query={HOSTNAMES_QUERY}
    kicker="Hostnames"
    title="Host footprint health"
    description="A hostname is green only when every observed app and process running on it stays fresh. This page consumes only hostname->appName grouped data."
    emptyTitle="No hostnames yet"
    emptyBody="Host-level rollups appear here once grouped hostname data begins flowing."
    groupLabel="Hostname"
    childPluralLabel="app names"
  />
);
