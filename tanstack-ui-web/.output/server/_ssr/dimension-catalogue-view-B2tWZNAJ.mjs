import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useHeartbeatGroups, c as deriveGroupHealthViews, P as Panel, a as EmptyPanel, H as HealthPill, f as formatAge, b as formatTimestamp } from "./router-Bt4Ieosv.mjs";
const DimensionCatalogueView = ({
  query,
  kicker,
  title,
  description,
  emptyTitle,
  emptyBody,
  groupLabel,
  childPluralLabel
}) => {
  const subscription = useHeartbeatGroups(query);
  const groups = deriveGroupHealthViews(subscription.groups, subscription.now);
  const groupLabelLower = groupLabel.toLowerCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Panel,
    {
      kicker,
      title,
      description,
      children: groups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyPanel, { title: emptyTitle, body: emptyBody }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-5 xl:grid-cols-2", children: groups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "article",
        {
          className: `rounded-[1.8rem] border p-6 ${group.stale ? "border-rose-400/28 bg-rose-500/8" : "border-emerald-400/28 bg-emerald-500/8"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-slate-400", children: groupLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 text-2xl font-semibold text-white", children: group.key })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HealthPill,
                {
                  label: group.stale ? `stale ${groupLabelLower}` : `healthy ${groupLabelLower}`,
                  tone: group.status
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: [
                  "Healthy ",
                  childPluralLabel
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: group.healthyChildren })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: [
                  "Stale ",
                  childPluralLabel
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: group.staleChildren })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Process instances" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-white", children: group.processInstances })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/6 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.28em] text-slate-400", children: "Oldest heartbeat" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-base font-semibold text-white", children: formatAge(group.oldestTimestamp, subscription.now) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-5 space-y-3", children: group.children.map((child) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
              `${group.key}:${child.key}`
            )) })
          ]
        },
        group.key
      )) })
    }
  );
};
export {
  DimensionCatalogueView as D
};
