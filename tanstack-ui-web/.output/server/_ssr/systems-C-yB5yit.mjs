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
const SYSTEMS_QUERY = {
  groupBy: "system",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const SystemsView = () => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
