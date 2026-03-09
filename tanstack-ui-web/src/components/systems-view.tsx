"use client";

import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  type HeartbeatGroupQuery
} from "../../../shared/heartbeat-contract";
import { DimensionCatalogueView } from "./dimension-catalogue-view";

const SYSTEMS_QUERY = {
  groupBy: "system",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

export const SystemsView = () => (
  <DimensionCatalogueView
    query={SYSTEMS_QUERY}
    kicker="Systems"
    title="Cross-app system health"
    description="A logical system is green only when every observed app, host and process under it stays fresh. This page consumes only system->appName grouped data."
    emptyTitle="No systems yet"
    emptyBody="System-level rollups appear here once grouped system data begins flowing."
    groupLabel="System"
    childPluralLabel="app names"
  />
);
