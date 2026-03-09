"use client";

import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  type HeartbeatGroupQuery
} from "../../../shared/heartbeat-contract";
import { DimensionCatalogueView } from "./dimension-catalogue-view";

const APPNAMES_QUERY = {
  groupBy: "appName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

export const AppNamesView = () => (
  <DimensionCatalogueView
    query={APPNAMES_QUERY}
    kicker="App Names"
    title="App rollout health"
    description="An app name is green only when every observed host and process under it stays fresh. This page consumes only appName->hostname grouped data."
    emptyTitle="No app names yet"
    emptyBody="App-level rollups appear here once grouped app data begins flowing."
    groupLabel="App name"
    childPluralLabel="hostnames"
  />
);
