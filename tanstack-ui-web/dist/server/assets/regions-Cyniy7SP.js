import { jsx, jsxs } from "react/jsx-runtime";
import { u as useHeartbeatGroups, d as deriveRegionHealthViews, P as Panel, a as EmptyPanel, H as HealthPill, f as formatAge, b as formatTimestamp, E as EMPTY_HEARTBEAT_GROUP_FILTERS } from "./router-Bt4Ieosv.js";
import "@tanstack/react-router";
import "effect";
import "effect/unstable/rpc";
import "react";
import "effect/Fiber";
import "@effect/platform-browser/BrowserSocket";
import "effect/Layer";
const REGIONS_QUERY = {
  groupBy: "region",
  childGroupBy: "system",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const RegionsView = () => {
  const subscription = useHeartbeatGroups(REGIONS_QUERY);
  const regionViews = deriveRegionHealthViews(subscription.groups, subscription.now);
  return /* @__PURE__ */ jsx(
    Panel,
    {
      kicker: "Regions",
      title: "Regional health catalogue",
      description: "A region is green only when every observed system, app, host and process underneath it is fresh. The UI receives region->system grouped views, not the raw process feed.",
      children: regionViews.length === 0 ? /* @__PURE__ */ jsx(
        EmptyPanel,
        {
          title: "No regions yet",
          body: "As soon as grouped region data arrives, regions will appear here with freshness and process instance counts."
        }
      ) : /* @__PURE__ */ jsx("div", { className: "grid gap-5 xl:grid-cols-2", children: regionViews.map((region) => /* @__PURE__ */ jsxs(
        "article",
        {
          className: `rounded-[1.8rem] border p-6 ${region.stale ? "border-rose-400/28 bg-rose-500/8" : "border-emerald-400/28 bg-emerald-500/8"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-slate-400", children: "Region" }),
                /* @__PURE__ */ jsx("h2", { className: "mt-2 text-2xl font-semibold text-white", children: region.region })
              ] }),
              /* @__PURE__ */ jsx(
                HealthPill,
                {
                  label: region.stale ? "stale region" : "healthy region",
                  tone: region.status
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Healthy systems" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: region.healthySystems })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Stale systems" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: region.staleSystems })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Process instances" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: region.processInstances })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Oldest heartbeat" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-base font-semibold text-white", children: formatAge(region.minTimestamp, subscription.now) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "mt-5 space-y-3", children: region.systems.map((system) => /* @__PURE__ */ jsxs(
              "li",
              {
                className: "flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3",
                children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: system.system }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                      system.count,
                      " process instances · ",
                      formatTimestamp(system.maxTimestamp)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(
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
