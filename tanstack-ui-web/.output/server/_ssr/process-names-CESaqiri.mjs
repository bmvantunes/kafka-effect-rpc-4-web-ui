import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { E as EMPTY_HEARTBEAT_GROUP_FILTERS } from "./router-Bt4Ieosv.mjs";
import { D as DimensionCatalogueView } from "./dimension-catalogue-view-B2tWZNAJ.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_libs/effect.mjs";
import "../_libs/effect__platform-browser.mjs";
const PROCESS_NAMES_QUERY = {
  groupBy: "processName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const ProcessNamesView = () => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
