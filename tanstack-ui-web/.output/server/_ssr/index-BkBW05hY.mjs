import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { e as useHeartbeatEndpoint, u as useHeartbeatGroups, E as EMPTY_HEARTBEAT_GROUP_FILTERS, d as deriveRegionHealthViews, c as deriveGroupHealthViews, s as summarizeMonitor, C as ConnectionPill, g as formatFreshnessWindow, M as MetricCard, b as formatTimestamp, f as formatAge, P as Panel, a as EmptyPanel, H as HealthPill } from "./router-Bt4Ieosv.mjs";
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
const REGION_SYSTEM_QUERY = {
  groupBy: "region",
  childGroupBy: "system",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const SYSTEM_APP_QUERY = {
  groupBy: "system",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const APP_HOST_QUERY = {
  groupBy: "appName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
};
const DashboardView = () => {
  const { wsUrl } = useHeartbeatEndpoint();
  const regionSubscription = useHeartbeatGroups(REGION_SYSTEM_QUERY);
  const systemSubscription = useHeartbeatGroups(SYSTEM_APP_QUERY);
  const appSubscription = useHeartbeatGroups(APP_HOST_QUERY);
  const regionViews = deriveRegionHealthViews(
    regionSubscription.groups,
    regionSubscription.now
  );
  const systemViews = deriveGroupHealthViews(
    systemSubscription.groups,
    systemSubscription.now
  );
  const summary = summarizeMonitor(
    regionSubscription.groups,
    systemSubscription.groups,
    appSubscription.groups,
    regionSubscription.now
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 lg:grid-cols-[1.4fr_0.9fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[2.2rem] border border-white/12 bg-white/8 p-7 shadow-[0_24px_100px_rgba(3,7,18,0.3)] backdrop-blur-xl md:p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.36em] text-cyan-200/70", children: "Live Heartbeat Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl", children: "Query only what the screen needs. Keep the board fast even when the backend tracks the full world." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-2xl text-base leading-7 text-slate-300", children: "Every process heartbeat now carries region, system, appName, hostname and processName. The UI subscribes to grouped views instead of the raw process stream." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectionPill, { status: regionSubscription.status }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-white/12 bg-white/6 px-3 py-1 font-mono text-xs text-slate-200", children: wsUrl })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[2.2rem] border border-white/12 bg-slate-950/72 p-7 shadow-[0_24px_100px_rgba(3,7,18,0.32)] backdrop-blur-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.36em] text-amber-200/70", children: "Health Rule" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4 text-sm leading-7 text-slate-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-white", children: "Region green" }),
            " only when every system, app, host and process heartbeat underneath that region is fresh."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-white", children: "System green" }),
            " only when every observed app, region, host and process under that system is fresh."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-slate-200", children: [
            "Example: if ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Gmail" }),
            " has 12 process heartbeats across regions and one old process drags the minimum timestamp down, Gmail turns red globally."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400", children: [
            "Freshness window:",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-slate-200", children: formatFreshnessWindow() })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          eyebrow: "Regions",
          value: `${summary.healthyRegions}/${summary.regions}`,
          caption: `${summary.staleRegions} stale regions right now`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          eyebrow: "Systems",
          value: `${summary.healthySystems}/${summary.systems}`,
          caption: `${summary.staleSystems} stale logical systems`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          eyebrow: "Apps",
          value: String(summary.apps),
          caption: "Observed app names across the fleet"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          eyebrow: "Processes",
          value: String(summary.processInstances),
          caption: "Observed process heartbeats in memory"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          eyebrow: "Latest heartbeat",
          value: formatAge(summary.lastHeartbeatAt, regionSubscription.now),
          caption: `Seen at ${formatTimestamp(summary.lastHeartbeatAt)}`
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Panel,
      {
        kicker: "Transport View",
        title: "Grouped subscriptions only",
        description: "This screen opens region->system, system->appName, and appName->hostname queries. It does not ingest the raw process heartbeat firehose.",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[1.6rem] border border-white/10 bg-white/5 p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: "Dashboard subscriptions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-300", children: "The homepage only pulls the grouped datasets it renders." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectionPill, { status: regionSubscription.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "Region groups" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: regionViews.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "System groups" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: systemViews.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "App groups" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: summary.apps })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "Process instances" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: summary.processInstances })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "Freshness window" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: formatFreshnessWindow() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "Latest heartbeat" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: formatAge(summary.lastHeartbeatAt, regionSubscription.now) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: "Latest heartbeat at" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-slate-100", children: formatTimestamp(summary.lastHeartbeatAt) })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Panel,
      {
        kicker: "Regional Board",
        title: "All regions at a glance",
        description: "Regions are streamed as aggregated groups with their system children, so the homepage never needs the raw per-process feed.",
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/regions",
              className: "rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12",
              children: "Open regions page"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/systems",
              className: "rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12",
              children: "Open systems page"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/appnames",
              className: "rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12",
              children: "Open app names page"
            }
          )
        ] }),
        children: regionViews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          EmptyPanel,
          {
            title: "No grouped region data yet",
            body: "Once the consumer ingests process heartbeats, grouped regional views will appear here."
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 xl:grid-cols-2", children: regionViews.map((region) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "article",
          {
            className: `rounded-[1.7rem] border p-5 ${region.stale ? "border-rose-400/30 bg-rose-500/8" : "border-emerald-400/30 bg-emerald-500/8"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-white", children: region.region }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-slate-300", children: [
                    region.healthySystems,
                    "/",
                    region.totalSystems,
                    " healthy systems ·",
                    " ",
                    region.processInstances,
                    " process instances"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HealthPill,
                  {
                    label: region.stale ? "stale region" : "healthy region",
                    tone: region.status
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Oldest process heartbeat" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-base font-semibold text-white", children: formatAge(region.minTimestamp, regionSubscription.now) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Newest process heartbeat" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-base font-semibold text-white", children: formatAge(region.newestTimestamp, regionSubscription.now) })
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
                        " process instances ·",
                        " ",
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
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Panel,
      {
        kicker: "Cross-Region Systems",
        title: "Logical system health summary",
        description: "Systems are streamed independently as system->appName groups, so the system rollup shows business systems separately from deployable app names.",
        children: systemViews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          EmptyPanel,
          {
            title: "No systems to roll up",
            body: "System-level grouped views appear once the consumer has seen at least one process heartbeat."
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: systemViews.slice(0, 6).map((system) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "article",
          {
            className: "rounded-[1.5rem] border border-white/10 bg-white/5 p-5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-white", children: system.key }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-400", children: [
                    system.processInstances,
                    " process instances across",
                    " ",
                    system.totalChildren,
                    " app names"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HealthPill,
                  {
                    label: system.stale ? "stale" : "healthy",
                    tone: system.status
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between text-sm text-slate-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Healthy app names" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-slate-100", children: [
                  system.healthyChildren,
                  "/",
                  system.totalChildren
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between text-sm text-slate-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Oldest heartbeat" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-slate-100", children: formatAge(system.oldestTimestamp, systemSubscription.now) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 space-y-2", children: system.children.map((child) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "li",
                {
                  className: "flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-white", children: child.key }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-slate-400", children: [
                        child.count,
                        " process instances · ",
                        formatTimestamp(child.maxTimestamp)
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      HealthPill,
                      {
                        label: child.stale ? "stale" : "healthy",
                        tone: child.status
                      }
                    )
                  ]
                },
                `${system.key}:${child.key}`
              )) })
            ]
          },
          system.key
        )) })
      }
    )
  ] });
};
const SplitComponent = DashboardView;
export {
  SplitComponent as component
};
