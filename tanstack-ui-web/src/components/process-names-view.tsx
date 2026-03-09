"use client";

import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  type HeartbeatGroupQuery
} from "../../../shared/heartbeat-contract";
import { DimensionCatalogueView } from "./dimension-catalogue-view";

const PROCESS_NAMES_QUERY = {
  groupBy: "processName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

export const ProcessNamesView = () => (
  <DimensionCatalogueView
    query={PROCESS_NAMES_QUERY}
    kicker="Process Names"
    title="Process role health"
    description="A process name is green only when every observed host running that process role stays fresh. This page consumes only processName->hostname grouped data."
    emptyTitle="No process names yet"
    emptyBody="Process-level rollups appear here once grouped process data begins flowing."
    groupLabel="Process name"
    childPluralLabel="hostnames"
  />
);
