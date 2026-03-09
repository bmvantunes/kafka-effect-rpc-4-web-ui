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
const APPNAMES_QUERY = {
  groupBy: "appName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const AppNamesView = () => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
