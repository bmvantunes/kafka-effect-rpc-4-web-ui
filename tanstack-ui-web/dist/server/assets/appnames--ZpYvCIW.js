import { jsx } from "react/jsx-runtime";
import { E as EMPTY_HEARTBEAT_GROUP_FILTERS } from "./router-Bt4Ieosv.js";
import { D as DimensionCatalogueView } from "./dimension-catalogue-view-B2tWZNAJ.js";
import "@tanstack/react-router";
import "effect";
import "effect/unstable/rpc";
import "react";
import "effect/Fiber";
import "@effect/platform-browser/BrowserSocket";
import "effect/Layer";
const APPNAMES_QUERY = {
  groupBy: "appName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const AppNamesView = () => /* @__PURE__ */ jsx(
  DimensionCatalogueView,
  {
    query: APPNAMES_QUERY,
    kicker: "App Names",
    title: "App rollout health",
    description: "An app name is green only when every observed host and process under it stays fresh. This page consumes only appName->hostname grouped data.",
    emptyTitle: "No app names yet",
    emptyBody: "App-level rollups appear here once grouped app data begins flowing.",
    groupLabel: "App name",
    childPluralLabel: "hostnames"
  }
);
const SplitComponent = AppNamesView;
export {
  SplitComponent as component
};
