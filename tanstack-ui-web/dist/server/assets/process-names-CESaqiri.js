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
const PROCESS_NAMES_QUERY = {
  groupBy: "processName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const ProcessNamesView = () => /* @__PURE__ */ jsx(
  DimensionCatalogueView,
  {
    query: PROCESS_NAMES_QUERY,
    kicker: "Process Names",
    title: "Process role health",
    description: "A process name is green only when every observed host running that process role stays fresh. This page consumes only processName->hostname grouped data.",
    emptyTitle: "No process names yet",
    emptyBody: "Process-level rollups appear here once grouped process data begins flowing.",
    groupLabel: "Process name",
    childPluralLabel: "hostnames"
  }
);
const SplitComponent = ProcessNamesView;
export {
  SplitComponent as component
};
