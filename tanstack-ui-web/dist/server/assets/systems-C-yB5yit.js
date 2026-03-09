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
const SYSTEMS_QUERY = {
  groupBy: "system",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const SystemsView = () => /* @__PURE__ */ jsx(
  DimensionCatalogueView,
  {
    query: SYSTEMS_QUERY,
    kicker: "Systems",
    title: "Cross-app system health",
    description: "A logical system is green only when every observed app, host and process under it stays fresh. This page consumes only system->appName grouped data.",
    emptyTitle: "No systems yet",
    emptyBody: "System-level rollups appear here once grouped system data begins flowing.",
    groupLabel: "System",
    childPluralLabel: "app names"
  }
);
const SplitComponent = SystemsView;
export {
  SplitComponent as component
};
