import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useHeartbeatGroups, E as EMPTY_HEARTBEAT_GROUP_FILTERS, d as deriveRegionHealthViews, P as Panel, a as EmptyPanel, H as HealthPill, f as formatAge, b as formatTimestamp } from "./router-Bt4Ieosv.mjs";
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
const REGIONS_QUERY = {
  groupBy: "region",
  childGroupBy: "system",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const RegionsView = () => {
  const subscription = useHeartbeatGroups(REGIONS_QUERY);
  const regionViews = deriveRegionHealthViews(subscription.groups, subscription.now);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Panel,
    {
      kicker: "Regions",
      title: "Regional health catalogue",
      description: "A region is green only when every observed system, app, host and process underneath it is fresh. The UI receives region->system grouped views, not the raw process feed.",
      children: regionViews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyPanel,
        {
          title: "No regions yet",
          body: "As soon as grouped region data arrives, regions will appear here with freshness and process instance counts."
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-5 xl:grid-cols-2", children: regionViews.map((region) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "article",
        {
          className: `rounded-[1.8rem] border p-6 ${region.stale ? "border-rose-400/28 bg-rose-500/8" : "border-emerald-400/28 bg-emerald-500/8"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-slate-400", children: "Region" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 text-2xl font-semibold text-white", children: region.region })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HealthPill,
                {
                  label: region.stale ? "stale region" : "healthy region",
                  tone: region.status
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Healthy systems" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: region.healthySystems })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Stale systems" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: region.staleSystems })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Process instances" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: region.processInstances })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Oldest heartbeat" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-base font-semibold text-white", children: formatAge(region.minTimestamp, subscription.now) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-5 space-y-3", children: region.systems.map((system) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "li",
              {
                className: "flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-white", children: system.system }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-slate-400", children: [
                      system.count,
                      " process instances · ",
                      formatTimestamp(system.maxTimestamp)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    HealthPill,
                    {
                      label: system.stale ? "stale" : "healthy",
                      tone: system.status
                    }
                  )
                ]
              },
              `${region.region}:${system.system}`
            )) })
          ]
        },
        region.region
      )) })
    }
  );
};
const SplitComponent = RegionsView;
export {
  SplitComponent as component
};
