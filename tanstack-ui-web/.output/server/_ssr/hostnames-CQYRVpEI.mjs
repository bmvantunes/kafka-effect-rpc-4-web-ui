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
const HOSTNAMES_QUERY = {
  groupBy: "hostname",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const HostnamesView = () => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
