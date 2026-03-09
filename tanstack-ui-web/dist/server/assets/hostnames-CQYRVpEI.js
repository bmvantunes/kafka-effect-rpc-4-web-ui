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
const HOSTNAMES_QUERY = {
  groupBy: "hostname",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const HostnamesView = () => /* @__PURE__ */ jsx(
  DimensionCatalogueView,
  {
    query: HOSTNAMES_QUERY,
    kicker: "Hostnames",
    title: "Host footprint health",
    description: "A hostname is green only when every observed app and process running on it stays fresh. This page consumes only hostname->appName grouped data.",
    emptyTitle: "No hostnames yet",
    emptyBody: "Host-level rollups appear here once grouped hostname data begins flowing.",
    groupLabel: "Hostname",
    childPluralLabel: "app names"
  }
);
const SplitComponent = HostnamesView;
export {
  SplitComponent as component
};
